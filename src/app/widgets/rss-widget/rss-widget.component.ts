import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
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
import { IRSSHeader } from "./IArticle";
import { RssFeedComponent } from "./rss-feed/rss-feed.component";
import { RssWidgetService } from "./rss.widget.service";
import { WidgetComponent } from "../widget/widget.component";

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
  public readonly isWidgetLoaded = signal(false);

  public readonly config = signal({ url: injectWidgetData("url", "") });
  public readonly configForm = form(this.config, (path) => requiredText(path.url));
  public readonly rssFeedResult = signal<IRSSHeader | undefined>(undefined);
  public readonly readArticles = signal(injectWidgetData<string[]>("readArticlesGuids", []));

  public readonly isFormValid = computed(() => this.configForm().valid());

  private readonly ERROR_GETTING_RSS_FEED = "Erreur pendant la récupération du flux RSS.";
  private readonly ERROR_MARKING_FEED_AS_READ = "Erreur pendant la mise à jour du widget RSS.";

  private readonly widgetId = inject(WIDGET_ID);
  private readonly rssWidgetService = inject(RssWidgetService);
  private readonly widgetService = inject(WidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public refreshWidget(): void {
    const { url } = this.config();
    if (this.isFormValid()) {
      this.isWidgetLoaded.set(false);
      this.rssWidgetService.fetchDataFromRssFeed(url).subscribe({
        next: (apiResult) => {
          const channel = (apiResult as { channel?: IRSSHeader } | null)?.channel;
          if (channel) {
            this.rssFeedResult.set(channel);
          }
          this.isWidgetLoaded.set(true);
        },
        error: (error) => this.errorHandlerService.handleError(error, this.ERROR_GETTING_RSS_FEED),
        complete: () => this.isWidgetLoaded.set(true)
      });
    }
  }

  public markArticleAsRead(guid: string): void {
    this.updateRssFeed([guid, ...this.readArticles()]);
  }

  public markAllFeedAsRead(): void {
    this.updateRssFeed(this.rssFeedResult()?.item.map((article) => article.guid) ?? []);
  }

  public getWidgetData(): { url: string } | undefined {
    return this.isFormValid() ? this.config() : undefined;
  }

  private updateRssFeed(readArticlesGuids: string[]): void {
    this.widgetService
      .updateWidgetData(this.widgetId, {
        url: this.config().url,
        readArticlesGuids
      })
      .subscribe({
        next: (response: IWidgetConfig) =>
          this.readArticles.set((response.data?.["readArticlesGuids"] as string[]) ?? []),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_MARKING_FEED_AS_READ)
      });
  }
}
