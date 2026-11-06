import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { Injector } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { WidgetList } from "./widget-list";
import { WidgetType } from "@widgets/widget-type";
import { provideHttpClient } from "@angular/common/http";
import { CdkDragDrop, CdkDropList } from "@angular/cdk/drag-drop";
import { By } from "@angular/platform-browser";
import { WidgetConfig } from "@widgets/widget-config";
import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget-tokens";

describe("WidgetList", () => {
  let fixture: ComponentFixture<WidgetList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetList);
  });

  it("Should display every type of widget", () => {
    const widgetListConfig: WidgetConfig[] = [
      { id: 43, type: WidgetType.WEATHER, widgetOrder: 1, tabId: 1 },
      { id: 44, type: WidgetType.RSS, widgetOrder: 2, tabId: 1 },
      { id: 45, type: WidgetType.CALENDAR, widgetOrder: 3, tabId: 1 },
      { id: 46, type: WidgetType.STRAVA, widgetOrder: 4, tabId: 1 },
      { id: 47, type: WidgetType.STEAM, widgetOrder: 5, tabId: 1 },
      { id: 48, type: WidgetType.WORKOUT, widgetOrder: 6, tabId: 1 },
      { id: 49, type: WidgetType.AIRPARIF, widgetOrder: 7, tabId: 1 },
      { id: 51, type: WidgetType.ECOWATT, widgetOrder: 9, tabId: 1 },
      { id: 52, type: WidgetType.INCIDENT, widgetOrder: 10, tabId: 1 }
    ];
    fixture.componentRef.setInput("widgetList", widgetListConfig);
    // Not whenStable: the pending requests of the widgets would keep the fixture unstable
    TestBed.tick();

    const element: HTMLElement = fixture.nativeElement;
    expect(
      [...element.querySelectorAll(".widget-container")].map((container) =>
        container.firstElementChild?.tagName.toLowerCase()
      )
    ).toEqual([
      "dash-weather-widget",
      "dash-rss-widget",
      "dash-calendar-widget",
      "dash-strava-widget",
      "dash-steam-widget",
      "dash-workout-widget",
      "dash-airparif-widget",
      "dash-ecowatt-widget",
      "dash-incident-widget"
    ]);
  });
});

describe("WidgetList rendering", () => {
  let fixture: ComponentFixture<WidgetList>;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  const renderedWidgets: WidgetConfig[] = [
    { id: 1, type: WidgetType.ECOWATT, widgetOrder: 0, tabId: 1 },
    { id: 2, type: WidgetType.RSS, widgetOrder: 1, tabId: 1 },
    { id: 3, type: WidgetType.WEATHER, widgetOrder: 2, tabId: 1, data: { city: "Paris" } }
  ];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(WidgetList);
    element = fixture.nativeElement;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput(
      "widgetList",
      renderedWidgets.map((widget) => ({ ...widget }))
    );
    // Not whenStable: the pending requests of the weather widget would keep the fixture unstable
    TestBed.tick();
    // The weather widget is created with its saved city
    const weatherRequests = httpTestingController.match((request) =>
      request.url.includes("/weatherWidget/")
    );
    expect(weatherRequests).toHaveLength(2);
    weatherRequests.forEach((request) => {
      expect(request.request.params.get("city")).toEqual("Paris");
      request.flush({});
    });
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  function getDropList(): CdkDropList<WidgetConfig[]> {
    return fixture.debugElement.query(By.css("#widget-list")).injector.get(CdkDropList);
  }

  function getWidgetTags(): string[] {
    return [...element.querySelectorAll(".widget-container")].map(
      (container) => container.firstElementChild?.tagName.toLowerCase() ?? ""
    );
  }

  it("Should display each widget with the component of its type", () => {
    expect(getWidgetTags()).toEqual([
      "dash-ecowatt-widget",
      "dash-rss-widget",
      "dash-weather-widget"
    ]);
    // Without saved data, the RSS widget is displayed in edit mode
    expect(element.querySelector("dash-rss-widget .widget-edit-mode")).toBeTruthy();
    expect(element.querySelector("dash-ecowatt-widget .widget-read-mode")).toBeTruthy();
  });

  it("Should only allow dragging the widgets in edit mode", async () => {
    const list = element.querySelector("#widget-list");
    expect(list?.classList).not.toContain("edit-mode");
    expect(element.querySelectorAll(".widget-container.cdk-drag-disabled")).toHaveLength(3);

    fixture.componentRef.setInput("toggleEditMode", true);
    await fixture.whenStable();
    expect(list?.classList).toContain("edit-mode");
    expect(element.querySelectorAll(".widget-container.cdk-drag-disabled")).toHaveLength(0);
  });

  it("Should sort the widgets of the grid both horizontally and vertically", () => {
    expect(getDropList().orientation).toEqual("mixed");
  });

  function getWidgetInjector(selector: string): Injector {
    return fixture.debugElement.query(By.css(selector)).injector;
  }

  it("Should provide the widget id and data to each widget", () => {
    expect(getWidgetInjector("dash-weather-widget").get(WIDGET_ID)).toEqual(3);
    expect(getWidgetInjector("dash-weather-widget").get(WIDGET_DATA)).toEqual({ city: "Paris" });
    expect(getWidgetInjector("dash-rss-widget").get(WIDGET_ID)).toEqual(2);
    expect(getWidgetInjector("dash-rss-widget").get(WIDGET_DATA)).toEqual({});
  });

  it("Should reorder the widgets, emit the new order and keep the widget components", async () => {
    let emittedWidgets: WidgetConfig[] = [];
    fixture.componentInstance.updateWidgetsOrderEvent.subscribe(
      (updatedWidgets) => (emittedWidgets = updatedWidgets)
    );
    const ecowattWidget = element.querySelector("dash-ecowatt-widget");
    getDropList().dropped.emit({ previousIndex: 0, currentIndex: 2 } as CdkDragDrop<
      WidgetConfig[]
    >);
    await fixture.whenStable();

    expect(emittedWidgets.map((widget) => [widget.id, widget.widgetOrder])).toEqual([
      [2, 0],
      [3, 1],
      [1, 2]
    ]);

    expect(getWidgetTags()).toEqual([
      "dash-rss-widget",
      "dash-weather-widget",
      "dash-ecowatt-widget"
    ]);
    expect(element.querySelector("dash-ecowatt-widget")).toBe(ecowattWidget);
  });

  it("Should display the new list of widgets", async () => {
    fixture.componentRef.setInput("widgetList", [renderedWidgets[0]]);
    await fixture.whenStable();
    expect(getWidgetTags()).toEqual(["dash-ecowatt-widget"]);
  });
});
