import { NgTemplateOutlet } from "@angular/common";
import { Component, contentChild, inject, TemplateRef } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatTooltip } from "@angular/material/tooltip";
import { WidgetService } from "@widgets/widget-service";
import { AbstractWidget } from "@widgets/abstract-widget/abstract-widget";
import { WIDGET_PERSISTENCE, WidgetPersistence } from "@widgets/abstract-widget/widget-persistence";
import { DeleteWidget } from "@widgets/widget/delete-widget/delete-widget";

/** Saves and deletes the widget with the WidgetService. */
function injectWidgetPersistence(): WidgetPersistence {
  const service = inject(WidgetService);
  return {
    updateWidgetData: (widgetId, data) => service.updateWidgetData(widgetId, data),
    deleteWidget: (widgetId) => service.notifyWidgetDeleted(widgetId)
  };
}

@Component({
  selector: "dash-widget",
  templateUrl: "./widget.html",
  providers: [{ provide: WIDGET_PERSISTENCE, useFactory: injectWidgetPersistence }],
  styleUrl: "./widget.scss",
  imports: [
    MatIconButton,
    MatTooltip,
    MatIcon,
    NgTemplateOutlet,
    MatButton,
    DeleteWidget,
    MatProgressSpinner
  ]
})
export class Widget extends AbstractWidget {
  protected readonly labels = {
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
}
