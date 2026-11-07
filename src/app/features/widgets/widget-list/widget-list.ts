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
import { cachedWidgetInjectors } from "@widgets/widget-tokens";
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

  public readonly widgets = linkedSignal(() => this.widgetList());
  public readonly widgetComponents = this.WIDGET_COMPONENTS;

  /** Injector providing the widget id and configuration, cached so the widget is not recreated. */
  public readonly getWidgetInjector = cachedWidgetInjectors(inject(Injector));

  public drop(event: CdkDragDrop<WidgetConfig[]>): void {
    if (event.previousIndex === event.currentIndex) {
      // Dropped where it was: the order is unchanged, nothing to save
      return;
    }
    const widgets = [...this.widgets()];
    moveItemInArray(widgets, event.previousIndex, event.currentIndex);
    // Widget configs are updated in place so that their (cached) components are kept
    widgets.forEach((widget, index) => (widget.widgetOrder = index));
    this.widgets.set(widgets);
    this.updateWidgetsOrderEvent.emit(widgets);
  }
}
