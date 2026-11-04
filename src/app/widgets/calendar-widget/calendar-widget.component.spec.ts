import { WIDGET_DATA, WIDGET_ID } from "../widget.tokens";
import { CalendarView, DateAdapter, provideCalendar } from "angular-calendar";
import { adapterFactory } from "angular-calendar/date-adapters/date-fns";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { registerLocaleData } from "@angular/common";
import localeFr from "@angular/common/locales/fr";
import { addMonths, endOfDay, subMonths } from "date-fns";
import { vi } from "vitest";
import { environment } from "../../../environments/environment";
import { WidgetService } from "../../services/widget.service";
import { ErrorHandlerService } from "../../services/error-handler.service";
import { CalendarWidgetComponent } from "./calendar-widget.component";
import { CalendarWidgetService } from "./calendar-widget.service";
import { EventDetailModalComponent } from "./event-detail-modal/event-detail-modal.component";
import { ICalendarData } from "./ICalendarData";
import { provideHttpClient } from "@angular/common/http";

const calendarPath = environment.backend_url + `/calendarWidget/`;
const ERROR_PARSING_EVENTS = "Erreur lors de la récupération des évènements.";

describe("CalendarWidgetComponent", () => {
  let component: CalendarWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CalendarWidgetService,
        DateAdapter,
        ErrorHandlerService,
        WidgetService,
        { provide: WIDGET_ID, useValue: 1 }
      ]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(CalendarWidgetComponent, "")
      .compileComponents();

    const fixture = TestBed.createComponent(CalendarWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  /** Loads the events of a single calendar. */
  async function loadEvents(calendarData: ICalendarData[]): Promise<void> {
    component.config.set({ calendarUrls: ["https://calendar.ical"] });
    component.refreshWidget();
    TestBed.tick();
    httpTestingController.expectOne(calendarPath).flush(calendarData);
    await flushResources();
  }

  it("should create", async () => {
    expect(component.config().calendarUrls).toEqual([]);
    component.refreshWidget();
    TestBed.tick();
    expect(component.events()).toEqual([]);
    expect(component.isCalendarViewMonth()).toEqual(true);
    component.config.set({ calendarUrls: ["https://calendar.ical"] });
    component.refreshWidget();
    TestBed.tick();
    const getCalendarDataRequest = httpTestingController.expectOne(
      environment.backend_url + `/calendarWidget/`
    );
    const getCalendarData = [
      {
        startDate: "2022-11-01T00:00:00.000+00:00",
        endDate: "2022-11-02T00:00:00.000+00:00",
        description: "La Toussaint"
      },
      {
        startDate: "2021-05-23T00:00:00.000+00:00",
        endDate: "2021-05-24T00:00:00.000+00:00",
        description: "Pentecôte"
      },
      {
        startDate: "2022-12-25T00:00:00.000+00:00",
        endDate: "2022-12-26T00:00:00.000+00:00",
        description: "Noël"
      },
      {
        startDate: "2023-12-24T00:00:00.000+00:00",
        endDate: "2023-12-25T00:00:00.000+00:00",
        description: "La veille de Noël"
      },
      {
        startDate: "2021-11-01T00:00:00.000+00:00",
        endDate: "2021-11-02T00:00:00.000+00:00",
        description: "La Toussaint"
      },
      {
        startDate: "2022-07-14T00:00:00.000+00:00",
        endDate: "2022-07-15T00:00:00.000+00:00",
        description: "La fête nationale"
      }
    ];
    getCalendarDataRequest.flush(getCalendarData);
    await flushResources();
    expect(component.events().length).toEqual(6);
    const calendarEvent = component.events()[0];
    expect(calendarEvent.title).toEqual("La Toussaint");
  });

  it("Should check actual view", () => {
    component.setView(CalendarView.Day);
    expect(component.isCalendarViewMonth()).toEqual(false);
    expect(component.isCalendarViewWeek()).toEqual(false);
    expect(component.isCalendarViewDay()).toEqual(true);
  });

  it("Should update the calendar urls", () => {
    expect(component.config().calendarUrls).toEqual([]);
    expect(component.widgetData()).toEqual(undefined);
    component.onCalendarUrlAdded();
    expect(component.config().calendarUrls).toEqual([""]);
    expect(component.widgetData()).toEqual({ calendarUrls: [""] });
    component.removeCalendarUrl(0);
    expect(component.widgetData()).toEqual(undefined);
  });

  it("Should send one request per calendar url", async () => {
    const calendarUrls = ["https://first.ical", "https://second.ical"];
    component.config.set({ calendarUrls });
    component.refreshWidget();
    TestBed.tick();

    const requests = httpTestingController.match(calendarPath);
    expect(requests.map((request) => request.request.method)).toEqual(["POST", "POST"]);
    expect(requests.map((request) => request.request.body)).toEqual(
      calendarUrls.map((calendarUrl) => ({ calendarUrl }))
    );
    requests[0].flush([
      {
        startDate: "2022-11-01T10:00:00.000Z",
        endDate: "2022-11-01T11:00:00.000Z",
        description: "Réunion"
      }
    ]);
    requests[1].flush([
      {
        startDate: "2022-11-02T10:00:00.000Z",
        endDate: "2022-11-02T11:00:00.000Z",
        description: "Rendez-vous"
      }
    ]);
    await flushResources();
    expect(component.events().map((event) => event.title)).toEqual(["Réunion", "Rendez-vous"]);
  });

  it("Should skip a failing calendar and display an error", async () => {
    const handleErrorSpy = vi
      .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
      .mockImplementation(() => undefined);
    component.config.set({ calendarUrls: ["https://failing.ical", "https://working.ical"] });
    component.refreshWidget();
    TestBed.tick();

    const requests = httpTestingController.match(calendarPath);
    requests[0].flush(null, { status: 500, statusText: "Server error" });
    requests[1].flush([
      {
        startDate: "2022-11-02T10:00:00.000Z",
        endDate: "2022-11-02T11:00:00.000Z",
        description: "Rendez-vous"
      }
    ]);
    await flushResources();

    expect(handleErrorSpy).toHaveBeenCalledTimes(1);
    expect(handleErrorSpy.mock.calls[0][1]).toEqual(ERROR_PARSING_EVENTS);
    expect(component.events().map((event) => event.title)).toEqual(["Rendez-vous"]);
  });

  it("Should ignore the incomplete events", async () => {
    await loadEvents([
      { startDate: "", endDate: "2022-11-02T00:00:00.000Z", description: "No start" },
      { startDate: "2022-11-01T00:00:00.000Z", endDate: "", description: "No end" },
      {
        startDate: "2022-11-01T00:00:00.000Z",
        endDate: "2022-11-02T00:00:00.000Z",
        description: ""
      },
      {
        startDate: "2022-11-01T00:00:00.000Z",
        endDate: "2022-11-02T00:00:00.000Z",
        description: "Complete"
      }
    ]);
    expect(component.events().map((event) => event.title)).toEqual(["Complete"]);
  });

  it("Should keep the hours of an event which is not all day long", async () => {
    await loadEvents([
      {
        startDate: "2022-11-01T10:30:00.000Z",
        endDate: "2022-11-01T12:00:00.000Z",
        description: "Réunion"
      }
    ]);
    const [event] = component.events();
    expect(event.allDay).toBe(false);
    expect(event.start).toEqual(new Date("2022-11-01T10:30:00.000Z"));
    expect(event.end).toEqual(new Date("2022-11-01T12:00:00.000Z"));
  });

  describe("All day events, whatever the timezone of the browser", () => {
    // Node applies a change of the TZ environment variable at runtime (no Node types in this project)
    const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
      .process.env;
    const initialTimezone = env["TZ"];

    afterEach(() => {
      if (initialTimezone === undefined) {
        delete env["TZ"];
      } else {
        env["TZ"] = initialTimezone;
      }
    });

    // West of UTC, with a half-hour offset, and east of UTC
    ["America/New_York", "Asia/Kolkata", "Europe/Paris", "Pacific/Auckland"].forEach((timezone) => {
      it(`Should display an all day event on its own day in ${timezone}`, async () => {
        env["TZ"] = timezone;
        await loadEvents([
          {
            startDate: "2022-11-01T00:00:00.000+00:00",
            endDate: "2022-11-02T00:00:00.000+00:00",
            description: "La Toussaint"
          }
        ]);
        const [event] = component.events();
        expect(event.allDay).toBe(true);
        expect(event.start).toEqual(new Date(2022, 10, 1));
        expect(event.end).toEqual(endOfDay(new Date(2022, 10, 1)));
      });
    });
  });

  it("Should open the detail of an event", () => {
    const openSpy = vi.spyOn(TestBed.inject(MatDialog), "open").mockReturnValue(undefined as never);
    const event = { title: "Réunion", start: new Date(2022, 10, 1) };
    component.openEventDetail(event);
    expect(openSpy).toHaveBeenCalledWith(EventDetailModalComponent, {
      width: "500px",
      data: event
    });
  });

  it("Should close the opened day of the month view", () => {
    expect(component.activeDayIsOpen()).toBe(true);
    component.closeOpenMonthViewDay();
    expect(component.activeDayIsOpen()).toBe(false);
  });
});

describe("CalendarWidgetComponent template", () => {
  const calendarUrl = "https://calendar.ical";
  let fixture: ComponentFixture<CalendarWidgetComponent>;
  let component: CalendarWidgetComponent;
  let httpTestingController: HttpTestingController;
  let element: HTMLElement;

  registerLocaleData(localeFr);

  function createComponent(widgetData: Record<string, unknown> | undefined): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideCalendar({ provide: DateAdapter, useFactory: adapterFactory }),
        { provide: WIDGET_ID, useValue: 1 },
        { provide: WIDGET_DATA, useValue: widgetData }
      ]
    });
    fixture = TestBed.createComponent(CalendarWidgetComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    httpTestingController = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpTestingController.verify();
  });

  function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return element.querySelector<T>(selector);
  }

  function getButtonByText(text: string): HTMLButtonElement | undefined {
    return [...element.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent?.trim() === text
    );
  }

  describe("Edit mode", () => {
    beforeEach(async () => {
      createComponent(undefined);
      await fixture.whenStable();
    });

    it("Should add and remove calendar urls", async () => {
      expect(query(".widget-edit-mode")).toBeTruthy();
      expect(query("#add-calendar-url")?.textContent).toContain(component.labels.addCalendar);
      expect(element.querySelectorAll(".calendar-url-container").length).toEqual(0);
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);

      query("#add-calendar-url")?.click();
      await fixture.whenStable();
      query("#add-calendar-url")?.click();
      await fixture.whenStable();
      const inputs = element.querySelectorAll<HTMLInputElement>(".calendar-url-container input");
      expect(inputs.length).toEqual(2);
      expect(inputs[0].placeholder).toEqual(component.labels.enterIcalUrl);
      expect(inputs[0].getAttribute("aria-label")).toEqual(component.labels.calendarUrl);
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(false);

      inputs[0].value = calendarUrl;
      inputs[0].dispatchEvent(new Event("input"));
      await fixture.whenStable();
      expect(component.config().calendarUrls).toEqual([calendarUrl, ""]);

      element.querySelectorAll<HTMLButtonElement>(".remove-calendar-url")[1].click();
      await fixture.whenStable();
      expect(component.config().calendarUrls).toEqual([calendarUrl]);
      expect(element.querySelectorAll(".calendar-url-container").length).toEqual(1);
    });

    it("Should save the calendar urls and load the events", async () => {
      query("#add-calendar-url")?.click();
      await fixture.whenStable();
      const input = query<HTMLInputElement>(".calendar-url-container input");
      input!.value = calendarUrl;
      input!.dispatchEvent(new Event("input"));
      await fixture.whenStable();

      query(".validate-button")?.click();
      const saveRequest = httpTestingController.expectOne(
        environment.backend_url + "/widget/updateWidgetData/1"
      );
      expect(saveRequest.request.body).toEqual({ data: { calendarUrls: [calendarUrl] } });
      saveRequest.flush({});
      // Not whenStable: the pending request of the events would keep the fixture unstable
      TestBed.tick();

      const eventsRequest = httpTestingController.expectOne(calendarPath);
      expect(eventsRequest.request.body).toEqual({ calendarUrl });
      eventsRequest.flush([]);
      await fixture.whenStable();
      expect(query(".widget-read-mode")).toBeTruthy();
      expect(query("mwl-calendar-month-view")).toBeTruthy();
    });
  });

  describe("Read mode", () => {
    beforeEach(async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2022, 10, 1, 12));
      createComponent({ calendarUrls: [calendarUrl] });
      TestBed.tick();
      httpTestingController.expectOne(calendarPath).flush([
        {
          startDate: "2022-11-01T09:00:00.000Z",
          endDate: "2022-11-01T10:00:00.000Z",
          description: "Réunion d'équipe"
        }
      ]);
      await fixture.whenStable();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("Should display the header and the month view", () => {
      expect(query(".widget-read-mode .widget-header")?.textContent).toContain(
        component.labels.calendar
      );
      expect(getButtonByText(component.labels.day)).toBeTruthy();
      expect(getButtonByText(component.labels.week)).toBeTruthy();
      expect(getButtonByText(component.labels.month)).toBeTruthy();
      expect(query("mwl-calendar-month-view")).toBeTruthy();
      expect(query("#calendar-selected-date h3")?.textContent?.trim()).toEqual("Novembre 2022");
      expect(component.events().map((event) => event.title)).toEqual(["Réunion d'équipe"]);
    });

    it("Should switch between the day, week and month views", async () => {
      getButtonByText(component.labels.week)?.click();
      await fixture.whenStable();
      expect(component.isCalendarViewWeek()).toBe(true);
      expect(query("mwl-calendar-week-view")).toBeTruthy();
      expect(query("mwl-calendar-month-view")).toBeNull();
      expect(query("mwl-calendar-week-view")?.textContent).toContain("Réunion d'équipe");

      getButtonByText(component.labels.day)?.click();
      await fixture.whenStable();
      expect(component.isCalendarViewDay()).toBe(true);
      expect(query("mwl-calendar-day-view")).toBeTruthy();

      getButtonByText(component.labels.month)?.click();
      await fixture.whenStable();
      expect(component.isCalendarViewMonth()).toBe(true);
      expect(query("mwl-calendar-month-view")).toBeTruthy();
    });

    it("Should navigate between the months", async () => {
      const navigationButtons = element.querySelectorAll<HTMLButtonElement>(
        "#date-navigation-container button"
      );
      expect(navigationButtons[1].textContent?.trim()).toEqual("Mar. 01");

      navigationButtons[2].click();
      await fixture.whenStable();
      expect(component.viewDate().getMonth()).toEqual(addMonths(new Date(), 1).getMonth());
      expect(component.activeDayIsOpen()).toBe(false);

      navigationButtons[0].click();
      await fixture.whenStable();
      navigationButtons[0].click();
      await fixture.whenStable();
      expect(component.viewDate().getMonth()).toEqual(subMonths(new Date(), 1).getMonth());

      navigationButtons[1].click();
      await fixture.whenStable();
      expect(component.viewDate().getMonth()).toEqual(new Date().getMonth());
    });

    it("Should open the detail of an event clicked in the opened day of the month view", async () => {
      const openSpy = vi
        .spyOn(TestBed.inject(MatDialog), "open")
        .mockReturnValue(undefined as never);

      query("mwl-calendar-month-view .cal-open-day-events .cal-event-title")?.click();
      expect(openSpy).toHaveBeenCalledWith(EventDetailModalComponent, {
        width: "500px",
        data: component.events()[0]
      });
    });

    it("Should open the detail of an event clicked in the week view", async () => {
      const openSpy = vi
        .spyOn(TestBed.inject(MatDialog), "open")
        .mockReturnValue(undefined as never);
      component.setView(CalendarView.Week);
      await fixture.whenStable();

      query<HTMLElement>("mwl-calendar-week-view .cal-event-title")?.click();
      expect(openSpy).toHaveBeenCalledWith(EventDetailModalComponent, {
        width: "500px",
        data: component.events()[0]
      });
    });

    it("Should reload the events when the widget is refreshed", async () => {
      query(".refresh-button")?.click();
      TestBed.tick();
      httpTestingController.expectOne(calendarPath).flush([]);
      await fixture.whenStable();
      expect(component.events()).toEqual([]);
    });

    it("Should display an error when the events can't be loaded", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      query(".refresh-button")?.click();
      TestBed.tick();
      httpTestingController
        .expectOne(calendarPath)
        .flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();
      expect(handleErrorSpy).toHaveBeenCalledWith(expect.anything(), ERROR_PARSING_EVENTS);
      expect(component.events()).toEqual([]);
    });
  });
});
