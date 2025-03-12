import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { isThisYear, isToday } from "date-fns";
import { IArticle } from "../IArticle";
import { SafePipe } from "../../../pipes/safe.pipe";
import { DateFormatPipe } from "../../../pipes/date-format.pipe";
import { NgClass } from "@angular/common";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";

@Component({
  selector: "dash-rss-feed",
  templateUrl: "./rss-feed.component.html",
  styleUrls: ["./rss-feed.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    NgClass,
    MatExpansionPanelContent,
    DateFormatPipe,
    SafePipe
  ]
})
export class RssFeedComponent {
  public readonly feed = input.required<IArticle[]>();

  public readonly readArticles = input.required<string[]>();

  public readonly markArticleAsReadEvent = output<string>();

  private currentOpenedArticle: string | undefined;

  public stripHtmlFromContent(content?: string): string {
    const div = document.createElement("div");
    div.innerHTML = content ?? "";
    return div.textContent ?? div.innerText ?? "";
  }

  public formatTitleForArticle(article: IArticle): string {
    const articlePubDate = article.pubDate ? article.pubDate : article.updated;
    const articleDate = new Date(articlePubDate ?? "");
    const date = this.getPublicationDateToDisplay(articleDate);
    return `${date} ${article.title}`;
  }

  public isArticleRead(guid: string): boolean {
    return this.readArticles().includes(guid);
  }

  public isArticleOpened(guid: string): boolean {
    return this.currentOpenedArticle !== undefined && this.currentOpenedArticle === guid;
  }

  public onOpenDetail(guid: string): void {
    if (!this.isArticleRead(guid)) {
      this.markArticleAsReadEvent.emit(guid);
    }
    this.currentOpenedArticle = guid;
  }

  public onClosePanel(): void {
    this.currentOpenedArticle = undefined;
  }

  private getPublicationDateToDisplay(articleDate: Date): string {
    if (isToday(articleDate)) {
      return articleDate.toLocaleTimeString("fr", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } else if (isThisYear(articleDate)) {
      return articleDate.toLocaleTimeString("fr", {
        day: "2-digit",
        month: "2-digit"
      });
    } else {
      return articleDate.toLocaleTimeString("fr", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }
  }
}
