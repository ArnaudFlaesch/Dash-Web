import { Component, Input, Output, EventEmitter } from '@angular/core';
import { isToday, isThisYear } from 'date-fns';
import { IArticle } from '../IArticle';

@Component({
  selector: 'app-rss-feed',
  templateUrl: './rss-feed.component.html',
  styleUrls: ['./rss-feed.component.scss']
})
export class RssFeedComponent {
  @Input()
  public feed: IArticle[] = [];

  @Input()
  public readArticles: string[] = [];

  @Output()
  public markArticleAsReadEvent = new EventEmitter<string>();

  public stripHtmlFromContent(content?: string): string {
    const div = document.createElement('div');
    div.innerHTML = content || '';
    return div.textContent || div.innerText || '';
  }

  public formatTitleForArticle(article: IArticle): string {
    const articlePubDate = article.pubDate ? article.pubDate : article.updated;
    const articleDate = new Date(articlePubDate ? articlePubDate : '');
    const date = this.getPublicationDateToDisplay(articleDate);
    return `${date} ${article.title}`;
  }

  public isArticleRead(guid: string): boolean {
    return this.readArticles.includes(guid);
  }

  public onOpenDetail(guid: string): void {
    if (!this.isArticleRead(guid)) {
      console.log(guid);
      this.markArticleAsReadEvent.emit(guid);
    }
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
