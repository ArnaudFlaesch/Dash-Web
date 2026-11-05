import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WidgetList } from "./widget-list";
import { WidgetTypeEnum } from "@widgets/widget-type.enum";
import { provideHttpClient } from "@angular/common/http";
import { CdkDragDrop, CdkDropList } from "@angular/cdk/drag-drop";
import { By } from "@angular/platform-browser";
import { IWidgetConfig } from "@widgets/widget-config.model";
import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget.tokens";

describe("WidgetList", () => {
  let component: WidgetList;
  let fixture: ComponentFixture<WidgetList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetList);
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

describe("WidgetList template", () => {
  let fixture: ComponentFixture<WidgetList>;
  let component: WidgetList;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  const renderedWidgets: IWidgetConfig[] = [
    { id: 1, type: WidgetTypeEnum.ECOWATT, widgetOrder: 0, tabId: 1 },
    { id: 2, type: WidgetTypeEnum.RSS, widgetOrder: 1, tabId: 1 },
    { id: 3, type: WidgetTypeEnum.WEATHER, widgetOrder: 2, tabId: 1, data: { city: "Paris" } }
  ];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(WidgetList);
    component = fixture.componentInstance;
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
    const dropList = fixture.debugElement.query(By.css("#widget-list")).injector.get(CdkDropList);
    expect(dropList.orientation).toEqual("mixed");
  });

  it("Should keep the widget components when the widgets are reordered", async () => {
    const ecowattWidget = element.querySelector("dash-ecowatt-widget");
    component.drop({ previousIndex: 0, currentIndex: 2 } as CdkDragDrop<IWidgetConfig[]>);
    await fixture.whenStable();

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
