import { IWidgetConfig } from './../../model/IWidgetConfig';
import { ErrorHandlerService } from './../../services/error.handler.service';
import { WidgetService } from './../../services/widget.service/widget.service';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IArticle, ImageContent, IRSSHeader } from './IArticle';
import { RssWidgetService } from './rss.widget.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { SafePipe } from '../../pipes/safe.pipe';
import { RssFeedComponent } from './rss-feed/rss-feed.component';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel } from '@angular/material/form-field';

import { WidgetComponent } from '../widget/widget.component';

@Component({
  selector: 'dash-rss-widget',
  templateUrl: './rss-widget.component.html',
  styleUrls: ['./rss-widget.component.scss', '../widget/widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    WidgetComponent,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatIconButton,
    MatTooltip,
    MatIcon,
    RssFeedComponent,
    SafePipe
  ]
})
export class RssWidgetComponent {
  private widgetId = inject<number>('widgetId' as any);
  private rssWidgetService = inject(RssWidgetService);
  private widgetService = inject(WidgetService);
  private errorHandlerService = inject(ErrorHandlerService);
  dateUtilsService = inject(DateUtilsService);

  public feed: IArticle[] = [];
  public description = '';
  public link = '';
  public title = '';
  public image: ImageContent | undefined = undefined;
  public isWidgetLoaded = false;

  public isFeedClosed = true;
  public readArticles: string[] = [];
  public urlFeed?: string;

  private ERROR_GETTING_RSS_FEED = 'Erreur pendant la récupération du flux RSS.';
  private ERROR_MARKING_FEED_AS_READ = 'Erreur pendant la mise à jour du widget RSS.';

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
        error: (error) => this.errorHandlerService.handleError(error, this.ERROR_GETTING_RSS_FEED),
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
    return (this.urlFeed ?? '').length > 0;
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
          this.errorHandlerService.handleError(error, this.ERROR_MARKING_FEED_AS_READ)
      });
  }
}
