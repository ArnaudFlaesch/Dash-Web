import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatIconButton } from "@angular/material/button";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatTooltip } from "@angular/material/tooltip";
import { SafePipe } from "../../pipes/safe.pipe";
import { IWidgetConfig } from "./../../model/IWidgetConfig";
import { ErrorHandlerService } from "./../../services/error.handler.service";
import { WidgetService } from "./../../services/widget.service/widget.service";
import { IRSSHeader } from "./IArticle";
import { RssFeedComponent } from "./rss-feed/rss-feed.component";
import { RssWidgetService } from "./rss.widget.service";

import { WidgetComponent } from "../widget/widget.component";

@Component({
  selector: "dash-rss-widget",
  templateUrl: "./rss-widget.component.html",
  styleUrls: ["./rss-widget.component.scss", "../widget/widget.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  public isWidgetLoaded = signal(false);

  public urlFeed?: string;
  public rssFeedResult: IRSSHeader | undefined;
  public readArticles: WritableSignal<string[]> = signal([]);

  private readonly ERROR_GETTING_RSS_FEED = "Erreur pendant la récupération du flux RSS.";
  private readonly ERROR_MARKING_FEED_AS_READ = "Erreur pendant la mise à jour du widget RSS.";

  private readonly widgetId = inject<number>("widgetId" as never);
  private readonly rssWidgetService = inject(RssWidgetService);
  private readonly widgetService = inject(WidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public refreshWidget(): void {
    if (this.urlFeed) {
      this.isWidgetLoaded.set(false);
      this.rssWidgetService.fetchDataFromRssFeed(this.urlFeed).subscribe({
        next: (apiResult: unknown) => {
          if (apiResult && (apiResult as Record<string, unknown>)["channel"] != null) {
            this.rssFeedResult = (apiResult as Record<string, unknown>)["channel"] as IRSSHeader;
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
    this.updateRssFeed(this.rssFeedResult?.item.map((article) => article.guid) ?? []);
  }

  public isFormValid(): boolean {
    return (this.urlFeed ?? "").length > 0;
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
          this.readArticles.set(
            response.data ? (response.data["readArticlesGuids"] as string[]) : []
          ),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_MARKING_FEED_AS_READ)
      });
  }
}
