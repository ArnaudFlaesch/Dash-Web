import { Component } from '@angular/core';
import { IArticle, IRSSHeader } from './IArticle';
import { RssWidgetService } from './rss.widget.service';

@Component({
  selector: 'app-rss-widget',
  templateUrl: './rss-widget.component.html',
  styleUrls: ['./rss-widget.component.scss']
})
export class RssWidgetComponent {
  public feed: IArticle[] = [];
  public description = 'null';
  public link = 'null';
  public title = 'null';

  public isFeedClosed = true;
  public readArticles: string[] = [];
  public urlFeed: string | null = null;

  constructor(private rssWidgetService: RssWidgetService) {}

  public refreshWidget() {
    if (this.urlFeed) {
      this.rssWidgetService.fetchDataFromRssFeed(this.urlFeed).subscribe({
        next: (apiResult: unknown) => {
          const res = (apiResult as Record<string, unknown>)['channel'] as IRSSHeader;
          this.description = res.description;
          this.feed = res.item;
          this.link = res.link;
          this.title = res.title;
        },
        error: (error) => console.error(error.message)
      });
    }
  }

  public formatTitleForArticle(article: IArticle) {
    const date = article.pubDate
      ? new Date(article.pubDate).toLocaleTimeString('fr', {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';
    return `${date} ${article.title}`;
  }

  public formatDateFromUTC(date: string): string {
    const parsedDate = new Date(date);
    return parsedDate.toLocaleString('fr');
  }

  public stripHtmlFromContent(content?: string) {
    const div = document.createElement('div');
    div.innerHTML = content || '';
    return div.textContent || div.innerText || '';
  }

  public getWidgetData = (): { url: string } | null =>
    this.urlFeed ? { url: this.urlFeed } : null;
}
