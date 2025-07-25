/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";

import { ErrorHandlerService } from "../../services/error.handler.service";
import { MiniWidgetService } from "../../services/widget.service/miniwidget.service";
import { WidgetService } from "../../services/widget.service/widget.service";
import { AbstractWidgetComponent } from "../abstract-widget/abstract-widget.component";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { MatButton, MatIconButton } from "@angular/material/button";
import { NgTemplateOutlet } from "@angular/common";

@Component({
  selector: "dash-mini-widget",
  templateUrl: "./mini-widget.component.html",
  styleUrls: ["./mini-widget.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgTemplateOutlet, MatIconButton, MatTooltip, MatIcon, MatButton, MatProgressSpinner]
})
export class MiniWidgetComponent extends AbstractWidgetComponent {
  protected override widgetService: WidgetService;
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly miniWidgetService = inject(MiniWidgetService);

  private readonly ERROR_UPDATING_WIDGET_DATA =
    "Erreur lors de la mise à jour de la configuration du widget.";

  public constructor() {
    super();
    this.widgetService = inject(WidgetService);
    this.widgetId = inject<number>("widgetId" as never);
  }

  public onValidation(): void {
    this.miniWidgetService
      .updateWidgetData(this.widgetId, {
        ...this.widgetData()
      })
      .subscribe({
        next: (data: unknown) => {
          // Emit onDataChanged()
          this.toReadMode();
          this.refreshWidget();
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_UPDATING_WIDGET_DATA)
      });
  }

  public deleteMiniWidget(): void {
    this.miniWidgetService._miniWidgetDeletedEvent.next(this.widgetId);
  }
}
