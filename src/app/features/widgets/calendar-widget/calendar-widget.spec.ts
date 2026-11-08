import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget-tokens";
import {
  CalendarEvent,
  CalendarMonthViewComponent,
  DateAdapter,
  provideCalendar
} from "angular-calendar";
import { adapterFactory } from "angular-calendar/date-adapters/date-fns";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MatDialog } from "@angular/material/dialog";
import { registerLocaleData } from "@angular/common";
import localeFr from "@angular/common/locales/fr";
import { endOfDay } from "date-fns";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { CalendarWidget } from "./calendar-widget";
import { EventDetailModal } from "./event-detail-modal/event-detail-modal";
import { CalendarData } from "./calendar-data";
import { provideHttpClient } from "@angular/common/http";

const calendarPath = environment.backend_url + "/calendar/events";
const ERROR_PARSING_EVENTS = "Erreur lors de la récupération des évènements.";

describe("CalendarWidget", () => {
  const calendarUrl = "https://calendar.ical";
  let fixture: ComponentFixture<CalendarWidget>;
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
    fixture = TestBed.createComponent(CalendarWidget);
    element = fixture.nativeElement as HTMLElement;
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

  /** Events given to the month view, displayed by default. */
  function getDisplayedEvents(): CalendarEvent[] {
    return fixture.debugElement.query(By.directive(CalendarMonthViewComponent)).componentInstance
      .events;
  }

  function getSelectedDate(): string | undefined {
    return query("#calendar-selected-date h3")?.textContent?.trim();
  }

  /** Creates the widget with saved calendars, which loads their events. */
  function createWidgetWithCalendars(calendarUrls: string[]): void {
    createComponent({ calendarUrls });
    TestBed.tick();
  }

  /** Creates the widget with a single calendar, and loads its events. */
  async function loadEvents(calendarData: CalendarData[]): Promise<void> {
    createWidgetWithCalendars([calendarUrl]);
    httpTestingController.expectOne(calendarPath).flush(calendarData);
    await fixture.whenStable();
  }

  describe("Edit mode", () => {
    beforeEach(async () => {
      createComponent(undefined);
      await fixture.whenStable();
    });

    it("Should not load events without calendar", () => {
      expect(query(".widget-edit-mode")).toBeTruthy();
      expect(query("mwl-calendar-month-view")).toBeNull();
      httpTestingController.expectNone(calendarPath);
    });

    it("Should add and remove calendar urls", async () => {
      expect(query("#add-calendar-url")?.textContent).toContain("Ajouter un calendrier");
      expect(element.querySelectorAll(".calendar-url-container")).toHaveLength(0);
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);

      query("#add-calendar-url")?.click();
      await fixture.whenStable();
      query("#add-calendar-url")?.click();
      await fixture.whenStable();
      let inputs = element.querySelectorAll<HTMLInputElement>(".calendar-url-container input");
      expect(inputs).toHaveLength(2);
      expect(inputs[0].placeholder).toEqual("Saisissez une URL iCal");
      expect(inputs[0].getAttribute("aria-label")).toEqual("URL du calendrier");
      expect(element.querySelector(".remove-calendar-url")?.getAttribute("aria-label")).toEqual(
        "Supprimer"
      );
      // Empty urls can't be saved
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);

      inputs[0].value = calendarUrl;
      inputs[0].dispatchEvent(new Event("input"));
      await fixture.whenStable();
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);

      element.querySelectorAll<HTMLButtonElement>(".remove-calendar-url")[1].click();
      await fixture.whenStable();
      inputs = element.querySelectorAll<HTMLInputElement>(".calendar-url-container input");
      expect([...inputs].map((input) => input.value)).toEqual([calendarUrl]);
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(false);

      element.querySelectorAll<HTMLButtonElement>(".remove-calendar-url")[0].click();
      await fixture.whenStable();
      expect(element.querySelectorAll(".calendar-url-container")).toHaveLength(0);
      // Without calendar, the configuration can't be saved
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
    });

    it("Should not save an empty or blank calendar url", async () => {
      query("#add-calendar-url")?.click();
      await fixture.whenStable();
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);

      const input = query<HTMLInputElement>(".calendar-url-container input");
      input!.value = "   ";
      input!.dispatchEvent(new Event("input"));
      await fixture.whenStable();
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
    });

    it("Should not cancel the edition of a widget which has never been saved", async () => {
      query("#add-calendar-url")?.click();
      await fixture.whenStable();
      const input = query<HTMLInputElement>(".calendar-url-container input");
      input!.value = calendarUrl;
      input!.dispatchEvent(new Event("input"));
      await fixture.whenStable();

      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(false);
      expect(query(".cancel-button")).toBeNull();
    });

    it("Should save the calendar urls and load the events", async () => {
      query("#add-calendar-url")?.click();
      await fixture.whenStable();
      const input = query<HTMLInputElement>(".calendar-url-container input");
      input!.value = calendarUrl;
      input!.dispatchEvent(new Event("input"));
      await fixture.whenStable();

      query(".validate-button")?.click();
      const saveRequest = httpTestingController.expectOne(environment.backend_url + "/widgets/1");
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

  describe("Events loading", () => {
    it("Should load the events of the calendar", async () => {
      await loadEvents([
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
      ]);
      expect(getDisplayedEvents().map((event) => event.title)).toEqual([
        "La Toussaint",
        "Pentecôte",
        "Noël",
        "La veille de Noël",
        "La Toussaint",
        "La fête nationale"
      ]);
    });

    it("Should send one request per calendar url", async () => {
      const calendarUrls = ["https://first.ical", "https://second.ical"];
      createWidgetWithCalendars(calendarUrls);

      const requests = httpTestingController.match(calendarPath);
      expect(requests.map((request) => request.request.method)).toEqual(["POST", "POST"]);
      expect(requests.map((request) => request.request.body)).toEqual(
        calendarUrls.map((url) => ({ calendarUrl: url }))
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
      await fixture.whenStable();
      expect(getDisplayedEvents().map((event) => event.title)).toEqual(["Réunion", "Rendez-vous"]);
    });

    it("Should skip a failing calendar and display an error", async () => {
      createWidgetWithCalendars(["https://failing.ical", "https://working.ical"]);
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);

      const requests = httpTestingController.match(calendarPath);
      requests[0].flush(null, { status: 500, statusText: "Server error" });
      requests[1].flush([
        {
          startDate: "2022-11-02T10:00:00.000Z",
          endDate: "2022-11-02T11:00:00.000Z",
          description: "Rendez-vous"
        }
      ]);
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorSpy.mock.calls[0][1]).toEqual(ERROR_PARSING_EVENTS);
      expect(getDisplayedEvents().map((event) => event.title)).toEqual(["Rendez-vous"]);
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
      expect(getDisplayedEvents().map((event) => event.title)).toEqual(["Complete"]);
    });

    it("Should display an all day event over several days on all its days", async () => {
      await loadEvents([
        {
          startDate: "2022-11-01T00:00:00.000Z",
          endDate: "2022-11-04T00:00:00.000Z",
          description: "Vacances"
        }
      ]);
      const [event] = getDisplayedEvents();
      expect(event.allDay).toBe(true);
      expect(event.start).toEqual(new Date(2022, 10, 1));
      expect(event.end).toEqual(endOfDay(new Date(2022, 10, 3)));
    });

    it("Should keep the hours of an event starting at midnight UTC which is not all day long", async () => {
      await loadEvents([
        {
          startDate: "2022-11-01T00:00:00.000Z",
          endDate: "2022-11-01T02:00:00.000Z",
          description: "Garde de nuit"
        }
      ]);
      const [event] = getDisplayedEvents();
      expect(event.allDay).toBe(false);
      expect(event.start).toEqual(new Date("2022-11-01T00:00:00.000Z"));
      expect(event.end).toEqual(new Date("2022-11-01T02:00:00.000Z"));
    });

    it("Should keep the hours of an event which is not all day long", async () => {
      await loadEvents([
        {
          startDate: "2022-11-01T10:30:00.000Z",
          endDate: "2022-11-01T12:00:00.000Z",
          description: "Réunion"
        }
      ]);
      const [event] = getDisplayedEvents();
      expect(event.allDay).toBe(false);
      expect(event.start).toEqual(new Date("2022-11-01T10:30:00.000Z"));
      expect(event.end).toEqual(new Date("2022-11-01T12:00:00.000Z"));
    });

    describe("All day events, whatever the timezone of the browser", () => {
      // Node applies a change of the TZ environment variable at runtime (no Node types in this project)
      const env = (
        globalThis as unknown as { process: { env: Record<string, string | undefined> } }
      ).process.env;
      const initialTimezone = env["TZ"];

      afterEach(() => {
        if (initialTimezone === undefined) {
          delete env["TZ"];
        } else {
          env["TZ"] = initialTimezone;
        }
      });

      // West of UTC, with a half-hour offset, and east of UTC
      ["America/New_York", "Asia/Kolkata", "Europe/Paris", "Pacific/Auckland"].forEach(
        (timezone) => {
          it(`Should display an all day event on its own day in ${timezone}`, async () => {
            env["TZ"] = timezone;
            await loadEvents([
              {
                startDate: "2022-11-01T00:00:00.000+00:00",
                endDate: "2022-11-02T00:00:00.000+00:00",
                description: "La Toussaint"
              }
            ]);
            const [event] = getDisplayedEvents();
            expect(event.allDay).toBe(true);
            expect(event.start).toEqual(new Date(2022, 10, 1));
            expect(event.end).toEqual(endOfDay(new Date(2022, 10, 1)));
          });
        }
      );
    });
  });

  describe("Read mode", () => {
    beforeEach(async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2022, 10, 1, 12));
      await loadEvents([
        {
          startDate: "2022-11-01T09:00:00.000Z",
          endDate: "2022-11-01T10:00:00.000Z",
          description: "Réunion d'équipe"
        }
      ]);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function getOpenedDayEventTitle(): HTMLElement | null {
      return query("mwl-calendar-month-view .cal-open-day-events .cal-event-title");
    }

    function expectSelectedView(view: "Jour" | "Mois" | "Semaine"): void {
      (["Jour", "Mois", "Semaine"] as const).forEach((viewLabel) =>
        expect(getButtonByText(viewLabel)?.classList.contains("mat-primary")).toBe(
          viewLabel === view
        )
      );
    }

    it("Should display the header and the month view", () => {
      expect(query(".widget-read-mode .widget-header")?.textContent).toContain("Agenda");
      expect(getButtonByText("Jour")).toBeTruthy();
      expect(getButtonByText("Semaine")).toBeTruthy();
      expect(getButtonByText("Mois")).toBeTruthy();
      expectSelectedView("Mois");
      expect(query("mwl-calendar-month-view")).toBeTruthy();
      expect(getSelectedDate()).toEqual("Novembre 2022");
      expect(getDisplayedEvents().map((event) => event.title)).toEqual(["Réunion d'équipe"]);
      // The day of the view date is opened
      expect(getOpenedDayEventTitle()?.textContent).toContain("Réunion d'équipe");
    });

    it("Should switch between the day, week and month views", async () => {
      getButtonByText("Semaine")?.click();
      await fixture.whenStable();
      expectSelectedView("Semaine");
      expect(query("mwl-calendar-week-view")).toBeTruthy();
      expect(query("mwl-calendar-month-view")).toBeNull();
      expect(query("mwl-calendar-week-view")?.textContent).toContain("Réunion d'équipe");

      getButtonByText("Jour")?.click();
      await fixture.whenStable();
      expectSelectedView("Jour");
      expect(query("mwl-calendar-day-view")).toBeTruthy();

      getButtonByText("Mois")?.click();
      await fixture.whenStable();
      expectSelectedView("Mois");
      expect(query("mwl-calendar-month-view")).toBeTruthy();
      expect(query("mwl-calendar-day-view")).toBeNull();
    });

    it("Should navigate between the months, and close the opened day", async () => {
      const navigationButtons = element.querySelectorAll<HTMLButtonElement>(
        "#date-navigation-container button"
      );
      expect(navigationButtons[1].textContent?.trim()).toEqual("Mar. 01");

      navigationButtons[2].click();
      await fixture.whenStable();
      expect(getSelectedDate()).toEqual("Décembre 2022");

      navigationButtons[0].click();
      await fixture.whenStable();
      expect(getSelectedDate()).toEqual("Novembre 2022");
      // Back on the month of the opened day, which has been closed
      expect(getOpenedDayEventTitle()).toBeNull();

      navigationButtons[0].click();
      await fixture.whenStable();
      expect(getSelectedDate()).toEqual("Octobre 2022");

      navigationButtons[1].click();
      await fixture.whenStable();
      expect(getSelectedDate()).toEqual("Novembre 2022");
    });

    it("Should open the detail of an event clicked in the opened day of the month view", () => {
      const openSpy = vi
        .spyOn(TestBed.inject(MatDialog), "open")
        .mockReturnValue(undefined as never);

      getOpenedDayEventTitle()?.click();
      expect(openSpy).toHaveBeenCalledWith(EventDetailModal, {
        width: "500px",
        data: getDisplayedEvents()[0]
      });
    });

    it("Should close the opened day when clicked, and open another day of the month", async () => {
      const getDayCell = (dayNumber: string): HTMLElement | undefined =>
        [...element.querySelectorAll<HTMLElement>("mwl-calendar-month-view .cal-day-cell")].find(
          (cell) =>
            !cell.classList.contains("cal-out-month") &&
            cell.querySelector(".cal-day-number")?.textContent?.trim() === dayNumber
        );

      getDayCell("1")?.click();
      await fixture.whenStable();
      expect(getOpenedDayEventTitle()).toBeNull();

      getDayCell("1")?.click();
      await fixture.whenStable();
      expect(getOpenedDayEventTitle()?.textContent).toContain("Réunion d'équipe");

      // A day without event is not opened
      getDayCell("2")?.click();
      await fixture.whenStable();
      expect(getOpenedDayEventTitle()).toBeNull();
    });

    it("Should label the icon only navigation buttons", () => {
      const navigationButtons = element.querySelectorAll<HTMLButtonElement>(
        "#date-navigation-container button"
      );
      expect(navigationButtons[0].getAttribute("aria-label")).toEqual("Précédent");
      expect(navigationButtons[2].getAttribute("aria-label")).toEqual("Suivant");
    });

    it("Should open the detail of an event clicked in the day view", async () => {
      const openSpy = vi
        .spyOn(TestBed.inject(MatDialog), "open")
        .mockReturnValue(undefined as never);
      getButtonByText("Jour")?.click();
      await fixture.whenStable();

      query<HTMLElement>("mwl-calendar-day-view .cal-event-title")?.click();
      expect(openSpy).toHaveBeenCalledWith(EventDetailModal, {
        width: "500px",
        data: expect.objectContaining({ title: "Réunion d'équipe" })
      });
    });

    it("Should restore the saved calendars when the edition is cancelled", async () => {
      query(".edit-button")?.click();
      await fixture.whenStable();
      query("#add-calendar-url")?.click();
      await fixture.whenStable();
      const inputs = element.querySelectorAll<HTMLInputElement>(".calendar-url-container input");
      inputs[1].value = "https://other.ical";
      inputs[1].dispatchEvent(new Event("input"));
      await fixture.whenStable();

      query(".cancel-button")?.click();
      await fixture.whenStable();
      expect(query(".widget-read-mode")).toBeTruthy();

      query(".edit-button")?.click();
      await fixture.whenStable();
      const restoredInputs = element.querySelectorAll<HTMLInputElement>(
        ".calendar-url-container input"
      );
      expect([...restoredInputs].map((input) => input.value)).toEqual([calendarUrl]);
    });

    it("Should open the detail of an event clicked in the week view", async () => {
      const openSpy = vi
        .spyOn(TestBed.inject(MatDialog), "open")
        .mockReturnValue(undefined as never);
      getButtonByText("Semaine")?.click();
      await fixture.whenStable();

      query<HTMLElement>("mwl-calendar-week-view .cal-event-title")?.click();
      expect(openSpy).toHaveBeenCalledWith(EventDetailModal, {
        width: "500px",
        data: expect.objectContaining({ title: "Réunion d'équipe" })
      });
    });

    it("Should reload the events when the widget is refreshed", async () => {
      query(".refresh-button")?.click();
      TestBed.tick();
      httpTestingController.expectOne(calendarPath).flush([]);
      await fixture.whenStable();
      expect(getDisplayedEvents()).toEqual([]);
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
      expect(getDisplayedEvents()).toEqual([]);
    });
  });
});
