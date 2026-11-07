import { NgTemplateOutlet } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatTooltip } from "@angular/material/tooltip";
import { MiniWidgetService } from "@widgets/mini-widget-service";
import { AbstractWidget } from "@widgets/abstract-widget/abstract-widget";
import { WIDGET_PERSISTENCE, WidgetPersistence } from "@widgets/abstract-widget/widget-persistence";

/** Saves and deletes the widget with the MiniWidgetService. */
function injectMiniWidgetPersistence(): WidgetPersistence {
  const service = inject(MiniWidgetService);
  return {
    updateWidgetData: (widgetId, data) => service.updateWidgetData(widgetId, data),
    deleteWidget: (widgetId) => service.notifyMiniWidgetDeleted(widgetId)
  };
}

@Component({
  selector: "dash-mini-widget",
  templateUrl: "./mini-widget.html",
  providers: [{ provide: WIDGET_PERSISTENCE, useFactory: injectMiniWidgetPersistence }],
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
}
