import { NgTemplateOutlet } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatTooltip } from "@angular/material/tooltip";
import { MiniWidgetService } from "../../services/widget.service/miniwidget.service";
import { AbstractWidgetComponent } from "../abstract-widget/abstract-widget.component";

@Component({
  selector: "dash-mini-widget",
  templateUrl: "./mini-widget.component.html",
  styleUrl: "./mini-widget.component.scss",
  imports: [NgTemplateOutlet, MatIconButton, MatTooltip, MatIcon, MatButton, MatProgressSpinner]
})
export class MiniWidgetComponent extends AbstractWidgetComponent {
  private readonly miniWidgetService = inject(MiniWidgetService);

  public onValidation(): void {
    this.miniWidgetService.updateWidgetData(this.widgetId, { ...this.widgetData() }).subscribe({
      next: () => this.onWidgetDataSaved(),
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_UPDATING_WIDGET_DATA)
    });
  }

  public deleteMiniWidget(): void {
    this.miniWidgetService.notifyMiniWidgetDeleted(this.widgetId);
  }
}
