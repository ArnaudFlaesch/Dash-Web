import { NgTemplateOutlet } from "@angular/common";
import { Component, contentChild, inject, TemplateRef } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatTooltip } from "@angular/material/tooltip";
import { WidgetService } from "@widgets/widget.service";
import { AbstractWidgetComponent } from "@widgets/abstract-widget/abstract-widget.component";
import { DeleteWidgetComponent } from "@widgets/widget/delete-widget/delete-widget.component";

@Component({
  selector: "dash-widget",
  templateUrl: "./widget.component.html",
  styleUrl: "./widget.component.scss",
  imports: [
    MatIconButton,
    MatTooltip,
    MatIcon,
    NgTemplateOutlet,
    MatButton,
    DeleteWidgetComponent,
    MatProgressSpinner
  ]
})
export class WidgetComponent extends AbstractWidgetComponent {
  public readonly labels = {
    widgetConfiguration: "Configuration du widget",
    deleteWidget: "Supprimer le widget",
    cancel: "Annuler",
    validate: "Valider",
    refreshWidget: "Actualiser le widget",
    editWidget: "Modifier le widget"
  };

  public readonly headerIcon = contentChild.required<TemplateRef<unknown>>("headerIcon");
  public readonly headerTitle = contentChild.required<TemplateRef<unknown>>("headerTitle");
  public readonly additionalActions = contentChild<TemplateRef<unknown>>("additionalActions");

  private readonly widgetService = inject(WidgetService);

  public onValidation(): void {
    this.widgetService.updateWidgetData(this.widgetId, { ...this.widgetData() }).subscribe({
      next: () => this.onWidgetDataSaved(),
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_UPDATING_WIDGET_DATA)
    });
  }

  public deleteWidget(): void {
    this.widgetService.notifyWidgetDeleted(this.widgetId);
  }
}
