import { inject, InjectionToken, Injector } from "@angular/core";

/** Id of the (mini) widget, provided to each dynamically created widget component. */
export const WIDGET_ID = new InjectionToken<number>("WIDGET_ID");

/** Saved configuration of the (mini) widget, provided to each dynamically created widget component. */
export const WIDGET_DATA = new InjectionToken<Record<string, unknown>>("WIDGET_DATA");

/** Returns the saved value of a widget configuration key, or the fallback when absent. */
export function injectWidgetData<T>(key: string, fallback: T): T {
  return (inject(WIDGET_DATA, { optional: true })?.[key] as T | undefined) ?? fallback;
}

/** Saved (mini) widget, as needed to create its component. */
export interface WidgetInjectorConfig {
  id: number;
  data?: Record<string, unknown>;
}

/** Injector providing its id and configuration to a dynamically created (mini) widget. */
export function createWidgetInjector(parent: Injector, widget: WidgetInjectorConfig): Injector {
  return Injector.create({
    providers: [
      { provide: WIDGET_ID, useValue: widget.id },
      { provide: WIDGET_DATA, useValue: widget.data ?? {} }
    ],
    parent
  });
}

/**
 * Returns a function giving the injector of a (mini) widget, cached by widget configuration so
 * that the component of the widget is not recreated on each change detection.
 */
export function cachedWidgetInjectors(
  parent: Injector
): (widget: WidgetInjectorConfig) => Injector {
  const injectors = new WeakMap<WidgetInjectorConfig, Injector>();
  return (widget) => {
    let widgetInjector = injectors.get(widget);
    if (!widgetInjector) {
      widgetInjector = createWidgetInjector(parent, widget);
      injectors.set(widget, widgetInjector);
    }
    return widgetInjector;
  };
}
