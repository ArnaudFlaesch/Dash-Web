import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { NgComponentOutlet } from "@angular/common";
import { Component, inject, Injector, input, linkedSignal, output, Type } from "@angular/core";
import { WidgetType } from "@widgets/widget-type";
import { WidgetConfig } from "@widgets/widget-config";
import { AirparifWidget } from "@widgets/airparif-widget/airparif-widget";
import { CalendarWidget } from "@widgets/calendar-widget/calendar-widget";
import { EcowattWidget } from "@widgets/ecowatt-widget/ecowatt-widget";
import { IncidentWidget } from "@widgets/incident-widget/incident-widget";
import { RssWidget } from "@widgets/rss-widget/rss-widget";
import { SteamWidget } from "@widgets/steam-widget/steam-widget";
import { StravaWidget } from "@widgets/strava-widget/strava-widget";
import { WeatherWidget } from "@widgets/weather-widget/weather-widget";
import { createWidgetInjector } from "@widgets/widget-tokens";
import { WorkoutWidget } from "@widgets/workout-widget/workout-widget";

@Component({
  selector: "dash-widget-list",
  templateUrl: "./widget-list.html",
  styleUrl: "./widget-list.scss",
  imports: [CdkDropList, CdkDrag, NgComponentOutlet]
})
export class WidgetList {
  private readonly WIDGET_COMPONENTS: Record<WidgetType, Type<unknown>> = {
    [WidgetType.WEATHER]: WeatherWidget,
    [WidgetType.RSS]: RssWidget,
    [WidgetType.CALENDAR]: CalendarWidget,
    [WidgetType.STRAVA]: StravaWidget,
    [WidgetType.STEAM]: SteamWidget,
    [WidgetType.WORKOUT]: WorkoutWidget,
    [WidgetType.AIRPARIF]: AirparifWidget,
    [WidgetType.ECOWATT]: EcowattWidget,
    [WidgetType.INCIDENT]: IncidentWidget
  };

  public readonly widgetList = input.required<WidgetConfig[]>();
  public readonly toggleEditMode = input(false);
  public readonly updateWidgetsOrderEvent = output<WidgetConfig[]>();

  protected readonly widgets = linkedSignal(() => this.widgetList());
  protected readonly widgetComponents = this.WIDGET_COMPONENTS;

  private readonly injector = inject(Injector);
  private readonly widgetInjectors = new WeakMap<WidgetConfig, Injector>();

  protected drop(event: CdkDragDrop<WidgetConfig[]>): void {
    const widgets = [...this.widgets()];
    moveItemInArray(widgets, event.previousIndex, event.currentIndex);
    // Widget configs are updated in place so that their (cached) components are kept
    widgets.forEach((widget, index) => (widget.widgetOrder = index));
    this.widgets.set(widgets);
    this.updateWidgetsOrderEvent.emit(widgets);
  }

  /** Injector providing the widget id and configuration, cached so the widget is not recreated. */
  protected getWidgetInjector(widget: WidgetConfig): Injector {
    let widgetInjector = this.widgetInjectors.get(widget);
    if (!widgetInjector) {
      widgetInjector = createWidgetInjector(this.injector, widget);
      this.widgetInjectors.set(widget, widgetInjector);
    }
    return widgetInjector;
  }
}
