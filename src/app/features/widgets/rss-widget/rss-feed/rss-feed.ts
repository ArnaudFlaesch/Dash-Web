import { Component, input, output, signal } from "@angular/core";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { isThisYear, isToday, isValid } from "date-fns";
import { DateFormatPipe } from "@shared/dates/date-format-pipe";
import { Article } from "../article";

@Component({
  selector: "dash-rss-feed",
  templateUrl: "./rss-feed.html",
  styleUrl: "./rss-feed.scss",
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelContent,
    DateFormatPipe
  ]
})
export class RssFeed {
  protected readonly labels = {
    publishedOn: "Publié le",
    by: "par"
  };

  public readonly feed = input.required<Article[]>();
  public readonly readArticles = input.required<string[]>();
  public readonly markArticleAsReadEvent = output<string>();
  private readonly currentOpenedArticle = signal<string | undefined>(undefined);

  public stripHtmlFromContent(content?: string): string {
    // The content is parsed in an inert document: no script is executed and no resource is loaded
    const parsedContent = new DOMParser().parseFromString(content ?? "", "text/html");
    return parsedContent.body.textContent;
  }

  public formatTitleForArticle(article: Article): string {
    const title = article.title ?? "";
    const articleDate = new Date(article.pubDate || article.updated || "");
    // Some articles have no (valid) publication date
    return isValid(articleDate)
      ? `${this.getPublicationDateToDisplay(articleDate)} ${title}`.trim()
      : title;
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
      // An undefined option is ignored
      year: isThisYear(articleDate) ? undefined : "numeric"
    });
  }
}
