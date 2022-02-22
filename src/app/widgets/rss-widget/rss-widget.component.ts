import { RssWidgetService } from './rss.widget.service';
import { Component } from '@angular/core';
import { IArticle, IRSSHeader, ImageContent } from './IArticle';
import * as xml2js from 'xml2js';

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
    this.urlFeed = this.urlForm;
    console.log('refreshWidget' + this.urlFeed);

    this.rssWidgetService.fetchDataFromRssFeed(url).subscribe({
      next: (apiResult) => {
        this.parser.parseString(apiResult, (err: unknown, result: any) => {
          console.log(result.rss.channel);
          const res = result.rss.channel;
          this.description = res.description;
          this.feed = res.item;
          this.link = res.link;
          this.title = res.title;
        });
        /* this.rssParser
          .parseString(apiResult)
          .then((response: unknown) => {
            const result = response as IRSSHeader;
            
            /* setDecription(result.description);
            setFeed(result.items);
            setImage(result.image);
            setLink(result.link);
            setTitle(result.title);
          })
          .catch((error: Error) => console.error(error.message));
          */
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
}
