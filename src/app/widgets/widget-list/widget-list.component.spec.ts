import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DateUtilsService } from "../../services/date.utils.service/date.utils.service";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { ThemeService } from "../../services/theme.service/theme.service";
import { WidgetService } from "../../services/widget.service/widget.service";
import { AirParifWidgetService } from "../airparif-widget/airparif-widget.service";
import { CalendarWidgetService } from "../calendar-widget/calendar-widget.service";
import { IncidentWidgetService } from "../incident-widget/incident.widget.service";
import { RssWidgetService } from "../rss-widget/rss.widget.service";
import { SteamWidgetService } from "../steam-widget/steam.widget.service";
import { StravaWidgetService } from "../strava-widget/strava.widget.service";
import { WeatherWidgetService } from "../weather-widget/weather.widget.service";
import { WorkoutWidgetService } from "../workout-widget/workout.widget.service";
import { WidgetListComponent } from "./widget-list.component";
import { WidgetTypeEnum } from "../../enums/WidgetTypeEnum";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { HomeComponent } from "../../home/home.component";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { IWidgetConfig } from "../../model/IWidgetConfig";
import { WIDGET_DATA, WIDGET_ID } from "../widget.tokens";

describe("WidgetListComponent", () => {
  let component: WidgetListComponent;
  let fixture: ComponentFixture<WidgetListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: "home",
            component: HomeComponent
          }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        RssWidgetService,
        SteamWidgetService,
        StravaWidgetService,
        AirParifWidgetService,
        WeatherWidgetService,
        CalendarWidgetService,
        WorkoutWidgetService,
        IncidentWidgetService,
        ErrorHandlerService,
        WidgetService,
        ThemeService,
        DateUtilsService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetListComponent);
    component = fixture.componentInstance;
  });

  it("Should display the widgets", () => {
    const widgetListConfig = [
      {
        id: 43,
        type: WidgetTypeEnum.WEATHER,
        widgetOrder: 1,
        tabId: 1
      },
      {
        id: 44,
        type: WidgetTypeEnum.RSS,
        widgetOrder: 2,
        tabId: 1
      },
      {
        id: 45,
        type: 3,
        widgetOrder: WidgetTypeEnum.CALENDAR,
        tabId: 1
      },
      {
        id: 46,
        type: WidgetTypeEnum.STRAVA,
        widgetOrder: 4,
        tabId: 1
      },
      {
        id: 47,
        type: WidgetTypeEnum.STEAM,
        widgetOrder: 5,
        tabId: 1
      },
      {
        id: 48,
        type: WidgetTypeEnum.WORKOUT,
        widgetOrder: 6,
        tabId: 1
      },
      {
        id: 49,
        type: WidgetTypeEnum.AIRPARIF,
        widgetOrder: 7,
        tabId: 1
      },
      {
        id: 51,
        type: WidgetTypeEnum.ECOWATT,
        widgetOrder: 9,
        tabId: 1
      },
      {
        id: 52,
        type: WidgetTypeEnum.INCIDENT,
        widgetOrder: 10,
        tabId: 1
      }
    ];
    fixture.componentRef.setInput("widgetList", widgetListConfig);
    expect(component).toBeTruthy();
  });

  const widgets: IWidgetConfig[] = [
    { id: 1, type: WidgetTypeEnum.WEATHER, widgetOrder: 0, tabId: 1, data: { city: "Paris" } },
    { id: 2, type: WidgetTypeEnum.RSS, widgetOrder: 1, tabId: 1 },
    { id: 3, type: WidgetTypeEnum.STEAM, widgetOrder: 2, tabId: 1 }
  ];

  it("Should reorder the widgets and emit the new order", () => {
    fixture.componentRef.setInput(
      "widgetList",
      widgets.map((widget) => ({ ...widget }))
    );
    let emittedWidgets: IWidgetConfig[] = [];
    component.updateWidgetsOrderEvent.subscribe(
      (updatedWidgets) => (emittedWidgets = updatedWidgets)
    );

    component.drop({ previousIndex: 0, currentIndex: 2 } as CdkDragDrop<IWidgetConfig[]>);

    expect(component.widgets().map((widget) => widget.id)).toEqual([2, 3, 1]);
    expect(emittedWidgets.map((widget) => [widget.id, widget.widgetOrder])).toEqual([
      [2, 0],
      [3, 1],
      [1, 2]
    ]);
  });

  it("Should provide the widget id and data to each widget", () => {
    const injector = component.getWidgetInjector(widgets[0]);
    expect(injector.get(WIDGET_ID)).toEqual(1);
    expect(injector.get(WIDGET_DATA)).toEqual({ city: "Paris" });
    expect(component.getWidgetInjector(widgets[0])).toBe(injector);
    expect(component.getWidgetInjector(widgets[1]).get(WIDGET_DATA)).toEqual({});
  });
});
