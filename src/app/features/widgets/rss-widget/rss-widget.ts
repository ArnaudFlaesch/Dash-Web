import { NgOptimizedImage } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "@shared/forms/form-validators";
import { MatIconButton } from "@angular/material/button";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatTooltip } from "@angular/material/tooltip";
import { WidgetConfig } from "@widgets/widget-config";
import { isResourceLoaded } from "@shared/resources/resource-status";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { WidgetService } from "@widgets/widget-service";
import { injectWidgetData, WIDGET_ID } from "@widgets/widget-tokens";
import { Article, RssHeader } from "./article";
import { RssFeed } from "./rss-feed/rss-feed";
import { RssWidgetService } from "./rss-widget-service";
import { catchError, map, of } from "rxjs";
import { Widget } from "@widgets/widget/widget";

@Component({
  selector: "dash-rss-widget",
  templateUrl: "./rss-widget.html",
  styleUrl: "./rss-widget.scss",
  imports: [
    NgOptimizedImage,
    Widget,
    MatFormField,
    MatLabel,
    MatInput,
    FormField,
    MatIconButton,
    MatTooltip,
    MatIcon,
    RssFeed
  ]
})
export class RssWidget {
  /**
   * Some feeds give the guid as an object (e.g. { isPermaLink: "true", "": "https://..." }),
   * so it is converted to a string to be compared with the read articles.
   */
  private guidToString(guid: unknown): string {
    if (typeof guid === "string") {
      return guid;
    }
    if (typeof guid === "number") {
      return guid.toString();
    }
    if (guid && typeof guid === "object") {
      const value = (guid as Record<string, unknown>)[""];
      return typeof value === "string" ? value : JSON.stringify(guid);
    }
    return "";
  }

  /** Read articles guids as strings, without duplicates. */
  private toReadArticlesGuids(guids: unknown[]): string[] {
    return [...new Set(guids.map((guid) => this.guidToString(guid)))];
  }

  protected readonly labels = {
    logo: "logo",
    url: "URL",
    enterRssFeedUrl: "Saisissez l'URL du flux RSS",
    markAllFeedAsRead: "Marquer tout le flux comme lu"
  };

  protected readonly config = signal({ url: injectWidgetData("url", "") });
  protected readonly configForm = form(this.config, (path) => requiredText(path.url));

  /** Channel of the RSS feed saved on the last refresh, reloaded on each refresh. */
  private readonly rssFeedResource = rxResource({
    params: () => this.refreshedFeed(),
    stream: ({ params: { url } }) =>
      this.rssWidgetService.fetchDataFromRssFeed(url).pipe(
        map((apiResult) => (apiResult as { channel?: RssHeader } | null)?.channel),
        map((channel) =>
          channel
            ? {
                ...channel,
                item: (channel.item ?? []).map((article): Article => ({
                  ...article,
                  guid: this.guidToString(article.guid)
                }))
              }
            : undefined
        ),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_RSS_FEED);
          return of(undefined);
        })
      ),
    defaultValue: undefined
  });

  protected readonly rssFeedResult = this.rssFeedResource.value;
  protected readonly isWidgetLoaded = computed(() =>
    isResourceLoaded(this.rssFeedResource.status())
  );
  protected readonly isLogoBroken = signal(false);
  protected readonly readArticles = signal(
    this.toReadArticlesGuids(injectWidgetData<unknown[]>("readArticlesGuids", []))
  );

  protected readonly isFormValid = computed(() => this.configForm().valid());
  protected readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));

  private readonly ERROR_GETTING_RSS_FEED = "Erreur pendant la récupération du flux RSS.";
  private readonly ERROR_MARKING_FEED_AS_READ = "Erreur pendant la mise à jour du widget RSS.";

  // A new object on each refresh, so that the resource reloads even if the url is unchanged
  private readonly refreshedFeed = signal<{ url: string } | undefined>(undefined);

  private readonly widgetId = inject(WIDGET_ID);
  private readonly rssWidgetService = inject(RssWidgetService);
  private readonly widgetService = inject(WidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  protected refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshedFeed.set({ url: this.config().url });
    }
  }

  protected markArticleAsRead(guid: string): void {
    this.updateRssFeed(this.toReadArticlesGuids([guid, ...this.readArticles()]));
  }

  protected markAllFeedAsRead(): void {
    // Without a loaded feed, the saved read articles would be erased
    const articles = this.rssFeedResult()?.item;
    if (articles) {
      this.updateRssFeed(articles.map((article) => article.guid));
    }
  }

  private updateRssFeed(readArticlesGuids: string[]): void {
    // Displayed as read right away, restored if the update fails
    const previousReadArticles = this.readArticles();
    this.readArticles.set(readArticlesGuids);
    this.widgetService
      .updateWidgetData(this.widgetId, {
        url: this.config().url,
        readArticlesGuids
      })
      .subscribe({
        next: (response: WidgetConfig) =>
          this.readArticles.set(
            this.toReadArticlesGuids((response.data?.["readArticlesGuids"] as unknown[]) ?? [])
          ),
        error: (error: HttpErrorResponse) => {
          this.readArticles.set(previousReadArticles);
          this.errorHandlerService.handleError(error, this.ERROR_MARKING_FEED_AS_READ);
        }
      });
  }
}
