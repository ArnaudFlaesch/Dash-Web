import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

/** Saves and deletes a (mini) widget: provided by Widget and MiniWidget to the AbstractWidget. */
export interface WidgetPersistence {
  updateWidgetData(widgetId: number, data: Record<string, unknown>): Observable<unknown>;
  deleteWidget(widgetId: number): void;
}

export const WIDGET_PERSISTENCE = new InjectionToken<WidgetPersistence>("WIDGET_PERSISTENCE");
