import { Component, input, output, signal } from "@angular/core";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { isThisYear, isToday } from "date-fns";
import { DateFormatPipe } from "../../../pipes/date-format.pipe";
import { SafePipe } from "../../../pipes/safe.pipe";
import { IArticle } from "../IArticle";

@Component({
  selector: "dash-rss-feed",
  templateUrl: "./rss-feed.component.html",
  styleUrl: "./rss-feed.component.scss",
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelContent,
    DateFormatPipe,
    SafePipe
  ]
})
export class RssFeedComponent {
  public readonly feed = input.required<IArticle[]>();
  public readonly readArticles = input.required<string[]>();
  public readonly markArticleAsReadEvent = output<string>();
  public readonly currentOpenedArticle = signal<string | undefined>(undefined);

  public stripHtmlFromContent(content?: string): string {
    const div = document.createElement("div");
    div.innerHTML = content ?? "";
    return div.textContent ?? div.innerText ?? "";
  }

  public formatTitleForArticle(article: IArticle): string {
    const articleDate = new Date(article.pubDate || article.updated || "");
    return `${this.getPublicationDateToDisplay(articleDate)} ${article.title}`;
  }

  public isArticleRead(guid: string): boolean {
    return this.readArticles().includes(guid);
  }

  public isArticleOpened(guid: string): boolean {
    return this.currentOpenedArticle() === guid;
  }

  public onOpenDetail(guid: string): void {
    if (!this.isArticleRead(guid)) {
      this.markArticleAsReadEvent.emit(guid);
    }
    this.currentOpenedArticle.set(guid);
  }

  public onClosePanel(): void {
    this.currentOpenedArticle.set(undefined);
  }

  private getPublicationDateToDisplay(articleDate: Date): string {
    if (isToday(articleDate)) {
      return articleDate.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" });
    }
    return articleDate.toLocaleTimeString("fr", {
      day: "2-digit",
      month: "2-digit",
      ...(isThisYear(articleDate) ? {} : { year: "numeric" as const })
    });
  }
}
