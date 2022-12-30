import { IWidgetConfig } from './../../model/IWidgetConfig';
import { ErrorHandlerService } from './../../services/error.handler.service';
import { WidgetService } from './../../services/widget.service/widget.service';
import { Component, Inject } from '@angular/core';
import { IArticle, ImageContent, IRSSHeader } from './IArticle';
import { RssWidgetService } from './rss.widget.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';

@Component({
  selector: 'app-rss-widget',
  templateUrl: './rss-widget.component.html',
  styleUrls: ['./rss-widget.component.scss']
})
export class RssWidgetComponent {
  public feed: IArticle[] = [];
  public description = '';
  public link = '';
  public title = '';
  public image: ImageContent | undefined = undefined;
  public isWidgetLoaded = false;

  public isFeedClosed = true;
  public readArticles: string[] = [];
  public urlFeed: string | null = null;

  private ERROR_GETTING_RSS_FEED = 'Erreur pendant la récupération du flux RSS.';
  private ERROR_MARKING_FEED_AS_READ = 'Erreur pendant la mise à jour du widget RSS.';

  constructor(
    @Inject('widgetId') private widgetId: number,
    private rssWidgetService: RssWidgetService,
    private widgetService: WidgetService,
    private errorHandlerService: ErrorHandlerService,
    public dateUtilsService: DateUtilsService
  ) {}

  public refreshWidget(): void {
    if (this.urlFeed) {
      this.isWidgetLoaded = false;
      this.rssWidgetService.fetchDataFromRssFeed(this.urlFeed).subscribe({
        next: (apiResult: unknown) => {
          if (apiResult) {
            if ((apiResult as Record<string, unknown>)['channel'] != null) {
              const res = (apiResult as Record<string, unknown>)['channel'] as IRSSHeader;
              this.description = res.description;
              this.feed = res.item;
              this.link = res.link;
              this.title = res.title;
              this.image = res.image;
            } else {
              const res = apiResult as Record<string, unknown>;
              this.feed = res['entry'] as IArticle[];
              this.title = res['title'] as string;
            }
          }
          this.isWidgetLoaded = true;
        },
        error: (error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_RSS_FEED),
        complete: () => (this.isWidgetLoaded = true)
      });
    }
  }

  public markArticleAsRead(guid: string): void {
    this.updateRssFeed([guid, ...this.readArticles]);
  }

  public markAllFeedAsRead(): void {
    this.updateRssFeed(this.feed.map((article) => article.guid));
  }

  public isFormValid(): boolean {
    return this.urlFeed !== null && this.urlFeed.length > 0;
  }

  public getWidgetData(): { url: string } | undefined {
    return this.urlFeed ? { url: this.urlFeed } : undefined;
  }

  private updateRssFeed(readArticlesGuids: string[]): void {
    this.widgetService
      .updateWidgetData(this.widgetId, {
        url: this.urlFeed,
        readArticlesGuids: readArticlesGuids
      })
      .subscribe({
        next: (response: IWidgetConfig) =>
          (this.readArticles = response.data
            ? (response.data['readArticlesGuids'] as string[])
            : []),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_MARKING_FEED_AS_READ)
      });
  }
}
