import { registerLocaleData } from "@angular/common";
import localeFr from "@angular/common/locales/fr";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CalendarEvent, DateAdapter, provideCalendar } from "angular-calendar";
import { adapterFactory } from "angular-calendar/date-adapters/date-fns";
import { vi } from "vitest";
import { CalendarWidgetView } from "./calendar-widget-view";

describe("CalendarWidgetView", () => {
  let fixture: ComponentFixture<CalendarWidgetView>;
  let element: HTMLElement;

  registerLocaleData(localeFr);

  const meeting: CalendarEvent = {
    title: "Réunion d'équipe",
    start: new Date("2022-11-01T09:00:00.000Z"),
    end: new Date("2022-11-01T10:00:00.000Z"),
    allDay: false
  };

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2022, 10, 1, 12));
    TestBed.configureTestingModule({
      providers: [provideCalendar({ provide: DateAdapter, useFactory: adapterFactory })]
    });
    fixture = TestBed.createComponent(CalendarWidgetView);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput("events", [meeting]);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return element.querySelector<T>(selector);
  }

  function getButtonByText(text: string): HTMLButtonElement | undefined {
    return [...element.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent?.trim() === text
    );
  }

  function getSelectedDate(): string | undefined {
    return query("#calendar-selected-date h3")?.textContent?.trim();
  }

  function getOpenedDayEventTitle(): HTMLElement | null {
    return query("mwl-calendar-month-view .cal-open-day-events .cal-event-title");
  }

  function expectSelectedView(view: "Jour" | "Mois" | "Semaine"): void {
    (["Jour", "Mois", "Semaine"] as const).forEach((viewLabel) =>
      expect(getButtonByText(viewLabel)?.classList.contains("mat-primary")).toBe(viewLabel === view)
    );
  }

  function spyOnEventSelected(): ReturnType<typeof vi.fn> {
    const eventSelectedSpy = vi.fn();
    fixture.componentInstance.eventSelected.subscribe(eventSelectedSpy);
    return eventSelectedSpy;
  }

  it("Should display the month view, with the day of the view date opened", () => {
    expect(getButtonByText("Jour")).toBeTruthy();
    expect(getButtonByText("Semaine")).toBeTruthy();
    expect(getButtonByText("Mois")).toBeTruthy();
    expectSelectedView("Mois");
    expect(query("mwl-calendar-month-view")).toBeTruthy();
    expect(getSelectedDate()).toEqual("Novembre 2022");
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

  it("Should emit the event clicked in the opened day of the month view", () => {
    const eventSelectedSpy = spyOnEventSelected();

    getOpenedDayEventTitle()?.click();
    expect(eventSelectedSpy).toHaveBeenCalledWith(meeting);
  });

  it("Should emit the event clicked in the week view", async () => {
    const eventSelectedSpy = spyOnEventSelected();
    getButtonByText("Semaine")?.click();
    await fixture.whenStable();

    query("mwl-calendar-week-view .cal-event-title")?.click();
    expect(eventSelectedSpy).toHaveBeenCalledWith(meeting);
  });

  it("Should emit the event clicked in the day view", async () => {
    const eventSelectedSpy = spyOnEventSelected();
    getButtonByText("Jour")?.click();
    await fixture.whenStable();

    query("mwl-calendar-day-view .cal-event-title")?.click();
    expect(eventSelectedSpy).toHaveBeenCalledWith(meeting);
  });
});
