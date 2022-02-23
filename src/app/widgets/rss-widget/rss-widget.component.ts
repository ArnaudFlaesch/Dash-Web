import { Component } from '@angular/core';
import * as xml2js from 'xml2js';
import { IArticle } from './IArticle';
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
  public parser = new xml2js.Parser({ explicitArray: false });
  public urlFeed = 'https://www.lefigaro.fr/rss/figaro_actualites.xml';
  public urlForm = 'test';

  constructor(private rssWidgetService: RssWidgetService) {
    if (this.urlFeed) {
      this.refreshWidget(this.urlFeed);
    }
  }

  public refreshWidget(url: string) {
    this.urlFeed = url;

    this.rssWidgetService.fetchDataFromRssFeed(url).subscribe({
      next: (apiResult) => {
        this.parser.parseString(apiResult, (err: unknown, result: any) => {
          const res = result.rss.channel;
          this.description = res.description;
          this.feed = res.item;
          this.link = res.link;
          this.title = res.title;
        });
      },
      error: (error) => console.error(error.message)
    });
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
}
