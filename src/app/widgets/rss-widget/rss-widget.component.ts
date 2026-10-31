import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "../../utils/form-validators";
import { MatIconButton } from "@angular/material/button";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatTooltip } from "@angular/material/tooltip";
import { SafePipe } from "../../pipes/safe.pipe";
import { IWidgetConfig } from "../../model/IWidgetConfig";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { WidgetService } from "../../services/widget.service/widget.service";
import { injectWidgetData, WIDGET_ID } from "../widget.tokens";
import { IArticle, IRSSHeader } from "./IArticle";
import { RssFeedComponent } from "./rss-feed/rss-feed.component";
import { RssWidgetService } from "./rss.widget.service";
import { catchError, map, of } from "rxjs";
import { WidgetComponent } from "../widget/widget.component";

/**
 * Some feeds give the guid as an object (e.g. { isPermaLink: "true", "": "https://..." }),
 * so it is converted to a string to be compared with the read articles.
 */
function guidToString(guid: unknown): string {
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
function toReadArticlesGuids(guids: unknown[]): string[] {
  return [...new Set(guids.map(guidToString))];
}

@Component({
  selector: "dash-rss-widget",
  templateUrl: "./rss-widget.component.html",
  styleUrl: "./rss-widget.component.scss",
  imports: [
    WidgetComponent,
    MatFormField,
    MatLabel,
    MatInput,
    FormField,
    MatIconButton,
    MatTooltip,
    MatIcon,
    RssFeedComponent,
    SafePipe
  ]
})
export class RssWidgetComponent {
  public readonly config = signal({ url: injectWidgetData("url", "") });
  public readonly configForm = form(this.config, (path) => requiredText(path.url));

  /** Channel of the RSS feed saved on the last refresh, reloaded on each refresh. */
  public readonly rssFeedResource = rxResource({
    params: () => this.refreshedFeed(),
    stream: ({ params: { url } }) =>
      this.rssWidgetService.fetchDataFromRssFeed(url).pipe(
        map((apiResult) => (apiResult as { channel?: IRSSHeader } | null)?.channel),
        map((channel) =>
          channel
            ? {
                ...channel,
                item: (channel.item ?? []).map((article): IArticle => ({
                  ...article,
                  guid: guidToString(article.guid)
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

  public readonly rssFeedResult = this.rssFeedResource.value;
  public readonly isWidgetLoaded = computed(() =>
    ["resolved", "local"].includes(this.rssFeedResource.status())
  );
  public readonly isLogoBroken = signal(false);
  public readonly readArticles = signal(
    toReadArticlesGuids(injectWidgetData<unknown[]>("readArticlesGuids", []))
  );

  public readonly isFormValid = computed(() => this.configForm().valid());

  private readonly ERROR_GETTING_RSS_FEED = "Erreur pendant la récupération du flux RSS.";
  private readonly ERROR_MARKING_FEED_AS_READ = "Erreur pendant la mise à jour du widget RSS.";

  // A new object on each refresh, so that the resource reloads even if the url is unchanged
  private readonly refreshedFeed = signal<{ url: string } | undefined>(undefined);

  private readonly widgetId = inject(WIDGET_ID);
  private readonly rssWidgetService = inject(RssWidgetService);
  private readonly widgetService = inject(WidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshedFeed.set({ url: this.config().url });
    }
  }

  public markArticleAsRead(guid: string): void {
    this.updateRssFeed(toReadArticlesGuids([guid, ...this.readArticles()]));
  }

  public markAllFeedAsRead(): void {
    this.updateRssFeed(this.rssFeedResult()?.item.map((article) => article.guid) ?? []);
  }

  public getWidgetData(): { url: string } | undefined {
    return this.isFormValid() ? this.config() : undefined;
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
        next: (response: IWidgetConfig) =>
          this.readArticles.set(
            toReadArticlesGuids((response.data?.["readArticlesGuids"] as unknown[]) ?? [])
          ),
        error: (error: HttpErrorResponse) => {
          this.readArticles.set(previousReadArticles);
          this.errorHandlerService.handleError(error, this.ERROR_MARKING_FEED_AS_READ);
        }
      });
  }
}
