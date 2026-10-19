import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { NgComponentOutlet } from "@angular/common";
import { Component, inject, Injector, input, linkedSignal, output, Type } from "@angular/core";
import { WidgetTypeEnum } from "../../enums/WidgetTypeEnum";
import { IWidgetConfig } from "../../model/IWidgetConfig";
import { AirParifWidgetComponent } from "../airparif-widget/airparif-widget.component";
import { CalendarWidgetComponent } from "../calendar-widget/calendar-widget.component";
import { EcowattWidgetComponent } from "../ecowatt-widget/ecowatt-widget.component";
import { IncidentWidgetComponent } from "../incident-widget/incident-widget.component";
import { RssWidgetComponent } from "../rss-widget/rss-widget.component";
import { SteamWidgetComponent } from "../steam-widget/steam-widget.component";
import { StravaWidgetComponent } from "../strava-widget/strava-widget.component";
import { WeatherWidgetComponent } from "../weather-widget/weather-widget.component";
import { WIDGET_DATA, WIDGET_ID } from "../widget.tokens";
import { WorkoutWidgetComponent } from "../workout-widget/workout-widget.component";

const WIDGET_COMPONENTS: Record<WidgetTypeEnum, Type<unknown>> = {
  [WidgetTypeEnum.WEATHER]: WeatherWidgetComponent,
  [WidgetTypeEnum.RSS]: RssWidgetComponent,
  [WidgetTypeEnum.CALENDAR]: CalendarWidgetComponent,
  [WidgetTypeEnum.STRAVA]: StravaWidgetComponent,
  [WidgetTypeEnum.STEAM]: SteamWidgetComponent,
  [WidgetTypeEnum.WORKOUT]: WorkoutWidgetComponent,
  [WidgetTypeEnum.AIRPARIF]: AirParifWidgetComponent,
  [WidgetTypeEnum.ECOWATT]: EcowattWidgetComponent,
  [WidgetTypeEnum.INCIDENT]: IncidentWidgetComponent
};

@Component({
  selector: "dash-widget-list",
  templateUrl: "./widget-list.component.html",
  styleUrl: "./widget-list.component.scss",
  imports: [CdkDropList, CdkDrag, NgComponentOutlet]
})
export class WidgetListComponent {
  public readonly widgetList = input.required<IWidgetConfig[]>();
  public readonly toggleEditMode = input(false);
  public readonly updateWidgetsOrderEvent = output<IWidgetConfig[]>();

  public readonly widgets = linkedSignal(() => this.widgetList());
  public readonly widgetComponents = WIDGET_COMPONENTS;

  private readonly injector = inject(Injector);
  private readonly widgetInjectors = new WeakMap<IWidgetConfig, Injector>();

  public drop(event: CdkDragDrop<IWidgetConfig[]>): void {
    const widgets = [...this.widgets()];
    moveItemInArray(widgets, event.previousIndex, event.currentIndex);
    // Widget configs are updated in place so that their (cached) components are kept
    widgets.forEach((widget, index) => (widget.widgetOrder = index));
    this.widgets.set(widgets);
    this.updateWidgetsOrderEvent.emit(widgets);
  }

  /** Injector providing the widget id and configuration, cached so the widget is not recreated. */
  public getWidgetInjector(widget: IWidgetConfig): Injector {
    let widgetInjector = this.widgetInjectors.get(widget);
    if (!widgetInjector) {
      widgetInjector = Injector.create({
        providers: [
          { provide: WIDGET_ID, useValue: widget.id },
          { provide: WIDGET_DATA, useValue: widget.data ?? {} }
        ],
        parent: this.injector
      });
      this.widgetInjectors.set(widget, widgetInjector);
    }
    return widgetInjector;
  }
}
