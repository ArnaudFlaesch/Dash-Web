import { inject, InjectionToken } from "@angular/core";

/** Id of the (mini) widget, provided to each dynamically created widget component. */
export const WIDGET_ID = new InjectionToken<number>("WIDGET_ID");

/** Saved configuration of the (mini) widget, provided to each dynamically created widget component. */
export const WIDGET_DATA = new InjectionToken<Record<string, unknown>>("WIDGET_DATA");

/** Returns the saved value of a widget configuration key, or the fallback when absent. */
export function injectWidgetData<T>(key: string, fallback: T): T {
  return (inject(WIDGET_DATA, { optional: true })?.[key] as T | undefined) ?? fallback;
}
