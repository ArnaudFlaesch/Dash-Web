import { HttpErrorResponse } from "@angular/common/http";
import { NgTemplateOutlet } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatTooltip } from "@angular/material/tooltip";
import { MiniWidgetService } from "@widgets/mini-widget-service";
import { AbstractWidget } from "@widgets/abstract-widget/abstract-widget";

@Component({
  selector: "dash-mini-widget",
  templateUrl: "./mini-widget.html",
  styleUrl: "./mini-widget.scss",
  imports: [NgTemplateOutlet, MatIconButton, MatTooltip, MatIcon, MatButton, MatProgressSpinner]
})
export class MiniWidget extends AbstractWidget {
  protected readonly labels = {
    cancel: "Annuler",
    validate: "Valider",
    deleteWidget: "Supprimer le widget",
    confirmDeletion: "Êtes-vous sûr de vouloir supprimer ce widget ?",
    delete: "Supprimer",
    doubleClickToEdit: "Double-cliquez pour modifier"
  };

  private readonly miniWidgetService = inject(MiniWidgetService);

  protected onValidation(): void {
    this.miniWidgetService.updateWidgetData(this.widgetId, { ...this.widgetData() }).subscribe({
      next: () => this.onWidgetDataSaved(),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_UPDATING_WIDGET_DATA)
    });
  }

  protected deleteMiniWidget(): void {
    this.miniWidgetService.notifyMiniWidgetDeleted(this.widgetId);
  }
}
