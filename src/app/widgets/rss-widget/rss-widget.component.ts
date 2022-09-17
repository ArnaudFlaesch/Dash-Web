import { IWidgetConfig } from './../../model/IWidgetConfig';
import { ErrorHandlerService } from './../../services/error.handler.service';
import { WidgetService } from './../../services/widget.service/widget.service';
import { Component, Inject } from '@angular/core';
import { IArticle, ImageContent, IRSSHeader } from './IArticle';
import { RssWidgetService } from './rss.widget.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DateUtilsService } from '../../../app/services/date.utils';
import { isThisYear, isToday } from 'date-fns';

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

  private ERROR_MARKING_FEED_AS_READ = 'Erreur pendant la mise à jour du widget RSS.';

  public isFeedClosed = true;
  public readArticles: string[];
  public urlFeed: string | null = null;

  constructor(
    @Inject('widgetId') private widgetId: number,
    private rssWidgetService: RssWidgetService,
    private widgetService: WidgetService,
    private errorHandlerService: ErrorHandlerService,
    public dateUtilsService: DateUtilsService
  ) {
    this.readArticles = [];
  }

  public refreshWidget() {
    if (this.urlFeed) {
      this.rssWidgetService.fetchDataFromRssFeed(this.urlFeed).subscribe({
        next: (apiResult: unknown) => {
          const res = (apiResult as Record<string, unknown>)['channel'] as IRSSHeader;
          this.description = res.description;
          this.feed = res.item;
          this.link = res.link;
          this.title = res.title;
          this.image = res.image;
        },
        error: (error) => this.errorHandlerService.handleError(error.message, 'erreur rss')
      });
    }
  }

  public formatTitleForArticle(article: IArticle) {
    const articleDate = new Date(article.pubDate);
    const date = this.getPublicationDateToDisplay(articleDate);
    return `${date} ${article.title}`;
  }

  public stripHtmlFromContent(content?: string) {
    const div = document.createElement('div');
    div.innerHTML = content || '';
    return div.textContent || div.innerText || '';
  }

  public onOpenDetail(guid: string): void {
    if (!this.readArticles.includes(guid)) {
      this.updateRssFeed([guid, ...this.readArticles]);
    }
  }

  public markAllFeedAsRead(): void {
    this.updateRssFeed(this.feed.map((article) => article.guid));
  }

  public updateRssFeed(readArticlesGuids: string[]): void {
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

  public isArticleRead = (guid: string): boolean => this.readArticles.includes(guid);
  public isFormValid = (): boolean => this.urlFeed !== null && this.urlFeed.length > 0;
  public getWidgetData = (): { url: string } | null =>
    this.urlFeed ? { url: this.urlFeed } : null;
}
