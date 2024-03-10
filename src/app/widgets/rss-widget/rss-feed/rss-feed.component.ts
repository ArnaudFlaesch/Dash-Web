import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { isToday, isThisYear } from 'date-fns';
import { IArticle } from '../IArticle';
import { SafePipe } from '../../../pipes/safe.pipe';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { NgFor, NgClass } from '@angular/common';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelContent } from '@angular/material/expansion';

@Component({
    selector: 'dash-rss-feed',
    templateUrl: './rss-feed.component.html',
    styleUrls: ['./rss-feed.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatAccordion, NgFor, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, NgClass, MatExpansionPanelContent, DateFormatPipe, SafePipe]
})
export class RssFeedComponent {
  @Input()
  public feed: IArticle[] = [];

  @Input()
  public readArticles: string[] = [];

  @Output()
  public markArticleAsReadEvent = new EventEmitter<string>();

  private currentOpenedArticle: string | undefined;

  public stripHtmlFromContent(content?: string): string {
    const div = document.createElement('div');
    div.innerHTML = content ?? '';
    return div.textContent ?? div.innerText ?? '';
  }

  public formatTitleForArticle(article: IArticle): string {
    const articlePubDate = article.pubDate ? article.pubDate : article.updated;
    const articleDate = new Date(articlePubDate ?? '');
    const date = this.getPublicationDateToDisplay(articleDate);
    return `${date} ${article.title}`;
  }

  public isArticleRead(guid: string): boolean {
    return this.readArticles.includes(guid);
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

  private getPublicationDateToDisplay(articleDate: Date) {
    if (isToday(articleDate)) {
      return articleDate.toLocaleTimeString('fr', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (isThisYear(articleDate)) {
      return articleDate.toLocaleTimeString('fr', {
        day: '2-digit',
        month: '2-digit'
      });
    } else {
      return articleDate.toLocaleTimeString('fr', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }
}
