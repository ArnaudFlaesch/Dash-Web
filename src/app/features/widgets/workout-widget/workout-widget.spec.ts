import { WIDGET_ID } from "@widgets/widget-tokens";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears
} from "date-fns";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { WorkoutSession, WorkoutStatsByPeriod, WorkoutType } from "./workout";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { WorkoutWidget } from "./workout-widget";
import { provideHttpClient } from "@angular/common/http";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { provideDateFnsAdapter } from "@angular/material-date-fns-adapter";
import { fr } from "date-fns/locale";
import { By } from "@angular/platform-browser";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatDatepickerInputHarness } from "@angular/material/datepicker/testing";
import { toUtcWallClock } from "@shared/dates/timezone";

describe("WorkoutWidget", () => {
  const dateFormat = "yyyy-MM-dd";
  let httpTestingController: HttpTestingController;
  let fixture: ComponentFixture<WorkoutWidget>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideDateFnsAdapter(),
        { provide: MAT_DATE_LOCALE, useValue: fr },
        { provide: WIDGET_ID, useValue: 1 }
      ]
    }).compileComponents();
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

  function intervalParams(start: Date, end: Date): string {
    return `dateIntervalStart=${format(start, dateFormat)}&dateIntervalEnd=${format(end, dateFormat)}`;
  }

  const workoutTypesUrl = environment.backend_url + "/workoutWidget/workoutTypes";
  const addWorkoutTypeUrl = environment.backend_url + "/workoutWidget/addWorkoutType";
  const createWorkoutSessionUrl = environment.backend_url + "/workoutWidget/createWorkoutSession";

  function workoutSessionsUrl(month: Date): string {
    return (
      environment.backend_url +
      `/workoutWidget/workoutSessions?${intervalParams(startOfMonth(month), endOfMonth(month))}`
    );
  }

  function statsByPeriodUrl(start: Date, end: Date): string {
    return (
      environment.backend_url + `/workoutWidget/workoutStatsByPeriod?${intervalParams(start, end)}`
    );
  }

  function statsByMonthUrl(start: Date, end: Date): string {
    return (
      environment.backend_url + `/workoutWidget/workoutStatsByMonth?${intervalParams(start, end)}`
    );
  }

  const weekStatsUrl = (): string =>
    statsByPeriodUrl(startOfISOWeek(new Date()), endOfWeek(new Date()));
  const monthStatsUrl = (month = new Date()): string =>
    statsByPeriodUrl(startOfMonth(month), endOfMonth(month));

  /** Answers the requests sent when the widget is created or refreshed. */
  function flushWidgetRequests(
    workoutTypes: WorkoutType[],
    workoutSessions: WorkoutSession[],
    weekStats: WorkoutStatsByPeriod[] = [],
    monthStats: WorkoutStatsByPeriod[] = []
  ): void {
    httpTestingController.expectOne(workoutTypesUrl).flush(workoutTypes);
    httpTestingController.expectOne(workoutSessionsUrl(new Date())).flush(workoutSessions);
    httpTestingController.expectOne(weekStatsUrl()).flush(weekStats);
    httpTestingController.expectOne(monthStatsUrl()).flush(monthStats);
  }

  /** Creates the widget, and answers its first requests. */
  async function createWidget(
    workoutTypes: WorkoutType[],
    workoutSessions: WorkoutSession[]
  ): Promise<void> {
    fixture = TestBed.createComponent(WorkoutWidget);
    element = fixture.nativeElement;
    TestBed.tick();
    flushWidgetRequests(workoutTypes, workoutSessions);
    await flushResources();
    await fixture.whenStable();
  }

  function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return element.querySelector<T>(selector);
  }

  function getButton(text: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(text)
    );
  }

  async function typeWorkoutTypeName(name: string): Promise<void> {
    const input = query<HTMLInputElement>("#add-workout-input");
    if (input) {
      input.value = name;
      input.dispatchEvent(new Event("input"));
    }
    await fixture.whenStable();
  }

  function getDatepickerInput(fieldSelector: string): Promise<MatDatepickerInputHarness> {
    return TestbedHarnessEnvironment.loader(fixture).getHarness(
      MatDatepickerInputHarness.with({ selector: `${fieldSelector} input` })
    );
  }

  async function goToStatisticsView(): Promise<void> {
    getButton("Statistiques")?.click();
    TestBed.tick();
    const today = startOfMonth(new Date());
    httpTestingController
      .expectOne(statsByMonthUrl(subMonths(today, 2), endOfMonth(today)))
      .flush([]);
    await flushResources();
    await fixture.whenStable();
  }

  describe("Loading", () => {
    it("should display a spinner, then the sessions, the statistics and the workout types", async () => {
      fixture = TestBed.createComponent(WorkoutWidget);
      element = fixture.nativeElement;
      TestBed.tick();
      expect(query(".loading-spinner")).not.toBeNull();
      expect(query("#workout-types-grid")).toBeNull();

      httpTestingController.expectOne(workoutTypesUrl).flush([{ id: 1, name: "Abdos", userId: 2 }]);
      await flushResources();
      httpTestingController
        .expectOne(workoutSessionsUrl(new Date()))
        .flush([{ id: 1, workoutDate: "2026-10-20", userId: 2 }]);
      await flushResources();
      httpTestingController
        .expectOne(weekStatsUrl())
        .flush([{ workoutTypeName: "Abdos", totalNumberOfReps: 50 }]);
      await flushResources();
      httpTestingController
        .expectOne(monthStatsUrl())
        .flush([{ workoutTypeName: "Abdos", totalNumberOfReps: 120 }]);
      await flushResources();
      await fixture.whenStable();

      expect(query(".loading-spinner")).toBeNull();
      expect(query(".widget-header")?.textContent).toContain("Workout");
      expect(element.querySelectorAll(".workout-session")).toHaveLength(1);
      expect(query(".workout-session")?.textContent).toContain("20/10/2026");
      expect(query("#workout-stats-by-week-container")?.textContent).toContain("Cette semaine");
      expect(query("#workout-stats-by-week-container .workout-stat")?.textContent).toContain(
        "Abdos"
      );
      expect(query("#workout-stats-by-week-container .workout-stat-reps")?.textContent).toContain(
        "50"
      );
      expect(query("#workout-stats-by-month-container")?.textContent).toContain("Ce mois-ci");
      expect(query("#workout-stats-by-month-container .workout-stat-reps")?.textContent).toContain(
        "120"
      );
      expect(query("#workout-types-grid .workout-type-name")?.textContent).toContain("Abdos");
      expect(query(".workout-empty-message")).toBeNull();
    });

    it("should display the empty states", async () => {
      await createWidget([], []);

      const emptyMessages = element.querySelectorAll(".workout-empty-message");
      expect(emptyMessages).toHaveLength(2);
      expect(emptyMessages[0].textContent).toContain("Aucune session ce mois-ci.");
      expect(emptyMessages[1].textContent).toContain("Aucun type d'exercice.");
      expect(query(".workout-stats-cards")).toBeNull();
      expect(query(".workout-session")).toBeNull();
      // The forms are empty, so they cannot be submitted
      expect(query<HTMLButtonElement>("#create-workout-session-button")?.disabled).toBe(true);
      expect(query<HTMLButtonElement>("#add-workout-type-button")?.disabled).toBe(true);
    });

    it("should handle the errors of the webservices", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      fixture = TestBed.createComponent(WorkoutWidget);
      element = fixture.nativeElement;
      TestBed.tick();

      for (const url of [
        workoutTypesUrl,
        workoutSessionsUrl(new Date()),
        weekStatsUrl(),
        monthStatsUrl()
      ]) {
        httpTestingController.expectOne(url).error(new ProgressEvent("Server error"));
        await flushResources();
      }
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        "Erreur lors de la récupération de la liste des types d'exercices."
      );
      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        "Erreur lors de la récupération de la liste des sessions d'exercices."
      );
      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        "Erreur lors de la récupération des statistiques."
      );
      expect(handleErrorSpy).toHaveBeenCalledTimes(4);
      // The widget is displayed, without data
      expect(query(".loading-spinner")).toBeNull();
      expect(element.querySelectorAll(".workout-empty-message")).toHaveLength(2);
    });

    it("should reload the data on refresh", async () => {
      await createWidget([], []);

      query(".refresh-button")?.click();
      TestBed.tick();
      // The widget stays displayed while its data is reloaded
      expect(query(".loading-spinner")).toBeNull();
      flushWidgetRequests(
        [{ id: 2, name: "Pompes", userId: 2 }],
        [{ id: 3, workoutDate: "2026-10-21", userId: 2 }],
        [],
        [{ workoutTypeName: "Pompes", totalNumberOfReps: 30 }]
      );
      await flushResources();
      await fixture.whenStable();

      expect(query("#workout-types-grid .workout-type-name")?.textContent).toContain("Pompes");
      expect(element.querySelectorAll(".workout-session")).toHaveLength(1);
      // Only the statistics of the month are displayed
      expect(query("#workout-stats-by-week-container")).toBeNull();
      expect(query("#workout-stats-by-month-container .workout-stat-reps")?.textContent).toContain(
        "30"
      );
    });
  });

  describe("Workout types", () => {
    it("should add a workout type from the input", async () => {
      await createWidget([], []);
      const input = query<HTMLInputElement>("#add-workout-input");
      const addButton = query<HTMLButtonElement>("#add-workout-type-button");
      expect(input?.closest("mat-form-field")?.querySelector("mat-label")?.textContent).toContain(
        "Ajouter un type d'exercice"
      );
      expect(addButton?.textContent).toContain("Ajouter");
      expect(input?.placeholder).toEqual("Pompes, tractions…");

      await typeWorkoutTypeName("Pompes");
      expect(addButton?.disabled).toBe(false);
      addButton?.click();

      const addWorkoutTypeRequest = httpTestingController.expectOne(addWorkoutTypeUrl);
      expect(addWorkoutTypeRequest.request.body).toEqual({ workoutType: "Pompes" });
      addWorkoutTypeRequest.flush({ id: 3, name: "Pompes", userId: 2 });
      await fixture.whenStable();

      expect(query("#workout-types-grid .workout-type-name")?.textContent).toContain("Pompes");
      // The input is emptied
      expect(input?.value).toEqual("");
      expect(addButton?.disabled).toBe(true);
    });

    it("should handle the error when adding a workout type", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      await createWidget([], []);

      await typeWorkoutTypeName("Pompes");
      query("#add-workout-type-button")?.click();
      httpTestingController
        .expectOne(addWorkoutTypeUrl)
        .flush(null, { status: 500, statusText: "Internal Server Error" });
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 500 }),
        "Erreur lors de la création d'un type d'exercice."
      );
      expect(query("#workout-types-grid .workout-type-name")).toBeNull();
      // The input is kept, so that the user can try again
      expect(query<HTMLInputElement>("#add-workout-input")?.value).toEqual("Pompes");
    });
  });

  describe("Workout sessions", () => {
    it("should not send invalid forms", async () => {
      await createWidget([], []);
      await typeWorkoutTypeName("   ");
      expect(query<HTMLButtonElement>("#add-workout-type-button")?.disabled).toBe(true);
      expect(query<HTMLButtonElement>("#create-workout-session-button")?.disabled).toBe(true);

      // Even if the (disabled) buttons are triggered
      fixture.debugElement
        .query(By.css("#add-workout-type-button"))
        .triggerEventHandler("click", new MouseEvent("click"));
      fixture.debugElement
        .query(By.css("#create-workout-session-button"))
        .triggerEventHandler("click", new MouseEvent("click"));

      httpTestingController.expectNone(addWorkoutTypeUrl);
      httpTestingController.expectNone(createWorkoutSessionUrl);
    });

    it("should create a workout session, edit it, then go back to the sessions list", async () => {
      await createWidget([{ id: 1, name: "Abdos", userId: 2 }], []);
      const workoutDateInput = await getDatepickerInput("#workout-date-picker-field");
      await workoutDateInput.setValue("01/09/2022");
      await workoutDateInput.blur();
      const createButton = query<HTMLButtonElement>("#create-workout-session-button");
      expect(createButton?.disabled).toBe(false);
      expect(createButton?.textContent).toContain("Créer");

      createButton?.click();
      const createRequest = httpTestingController.expectOne(createWorkoutSessionUrl);
      expect(createRequest.request.method).toEqual("POST");
      expect(createRequest.request.body).toEqual({
        workoutDate: toUtcWallClock(new Date(2022, 8, 1))
      });
      createRequest.flush({ id: 9, workoutDate: "2022-09-01", userId: 2 });
      TestBed.tick();

      // The created session is edited
      httpTestingController
        .expectOne(environment.backend_url + "/workoutWidget/workoutExercises?workoutSessionId=9")
        .flush([]);
      await fixture.whenStable();
      expect(query("dash-workout-session-edit #workout-session-date")?.textContent).toContain(
        "01/09/2022"
      );

      query(".workout-back-button")?.click();
      await fixture.whenStable();
      expect(query("dash-workout-session-edit")).toBeNull();
      expect(element.querySelectorAll(".workout-session")).toHaveLength(1);
      expect(query(".workout-session")?.textContent).toContain("01/09/2022");
    });

    it("should handle the error when creating a workout session", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      await createWidget([], []);
      const workoutDateInput = await getDatepickerInput("#workout-date-picker-field");
      await workoutDateInput.setValue("01/09/2022");
      await workoutDateInput.blur();

      query("#create-workout-session-button")?.click();
      httpTestingController
        .expectOne(createWorkoutSessionUrl)
        .flush(null, { status: 500, statusText: "Internal Server Error" });
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 500 }),
        "Erreur lors de la création d'une session d'exercices."
      );
      expect(query(".workout-session")).toBeNull();
      expect(query("dash-workout-session-edit")).toBeNull();
    });

    it("should edit a session, then go back to the sessions list", async () => {
      await createWidget(
        [{ id: 1, name: "Abdos", userId: 2 }],
        [{ id: 7, workoutDate: "2026-10-20", userId: 2 }]
      );

      query(".workout-session")?.click();
      TestBed.tick();
      httpTestingController
        .expectOne(environment.backend_url + "/workoutWidget/workoutExercises?workoutSessionId=7")
        .flush([{ workoutTypeId: 1, numberOfReps: 5 }]);
      await fixture.whenStable();

      expect(query("#workout-sessions-grid .workout-session")).toBeNull();
      expect(query("dash-workout-session-edit")).not.toBeNull();
      expect(query(".workout-number-of-reps")?.textContent).toContain("5");
      expect(query(".workout-back-button")?.textContent).toContain("Sessions");

      query(".workout-back-button")?.click();
      await fixture.whenStable();

      expect(query("dash-workout-session-edit")).toBeNull();
      expect(element.querySelectorAll(".workout-session")).toHaveLength(1);
    });

    it("should load the sessions and the statistics of the month picked in the datepicker", async () => {
      await createWidget([], []);
      const monthInput = await getDatepickerInput(".workout-month-field");
      expect(query(".workout-month-field mat-label")?.textContent).toContain("Mois");
      await monthInput.openCalendar();
      const calendar = await monthInput.getCalendar();
      await calendar.selectCell({ text: "2022" });

      // The calendar is closed once the month is picked, so the click is not awaited by a harness
      const novemberCell = Array.from(
        document.querySelectorAll<HTMLElement>(".mat-calendar-body-cell")
      ).find((cell) => cell.textContent?.trim().toLowerCase().startsWith("nov"));
      novemberCell?.click();
      TestBed.tick();
      const selectedMonth = new Date(2022, 10, 1);
      httpTestingController.expectOne(workoutSessionsUrl(selectedMonth)).flush([]);
      httpTestingController.expectOne(monthStatsUrl(selectedMonth)).flush([]);
      await flushResources();
      await fixture.whenStable();

      expect(await monthInput.isCalendarOpen()).toBe(false);
      expect(await monthInput.getValue()).toEqual("01/11/2022");
    });

    it("should not load the sessions of an invalid month", async () => {
      await createWidget([], []);
      const monthInput = await getDatepickerInput(".workout-month-field");
      await monthInput.setValue("invalid");
      await monthInput.blur();

      httpTestingController.expectNone((request) => request.url.includes("/workoutSessions"));
      httpTestingController.expectNone((request) => request.url.includes("/workoutStatsByPeriod"));
    });
  });

  describe("Statistics", () => {
    it("should select the period of the statistics, then go back to the sessions list", async () => {
      await createWidget([], []);
      const today = startOfMonth(new Date());

      await goToStatisticsView();
      expect(query("dash-workout-statistics")).not.toBeNull();
      expect(query(".workout-view h3")?.textContent).toContain("Statistiques");

      const periods = element.querySelectorAll<HTMLButtonElement>(".workout-period");
      expect(Array.from(periods).map((period) => period.textContent?.trim())).toEqual([
        "3 derniers mois",
        "6 derniers mois",
        "Cette année",
        "Année dernière"
      ]);
      expect(periods[0].classList).toContain("selected");

      periods[1].click();
      TestBed.tick();
      httpTestingController
        .expectOne(statsByMonthUrl(subMonths(today, 5), endOfMonth(today)))
        .flush([]);
      await flushResources();
      await fixture.whenStable();
      expect(periods[0].classList).not.toContain("selected");
      expect(periods[1].classList).toContain("selected");

      periods[2].click();
      TestBed.tick();
      httpTestingController
        .expectOne(statsByMonthUrl(startOfYear(today), endOfYear(today)))
        .flush([]);
      await flushResources();
      await fixture.whenStable();
      expect(periods[1].classList).not.toContain("selected");
      expect(periods[2].classList).toContain("selected");

      periods[3].click();
      TestBed.tick();
      const lastYear = subYears(today, 1);
      httpTestingController
        .expectOne(statsByMonthUrl(startOfYear(lastYear), endOfYear(lastYear)))
        .flush([]);
      await flushResources();
      await fixture.whenStable();
      expect(periods[2].classList).not.toContain("selected");
      expect(periods[3].classList).toContain("selected");

      periods[0].click();
      TestBed.tick();
      httpTestingController
        .expectOne(statsByMonthUrl(subMonths(today, 2), endOfMonth(today)))
        .flush([]);
      await flushResources();
      await fixture.whenStable();
      expect(periods[3].classList).not.toContain("selected");
      expect(periods[0].classList).toContain("selected");

      query<HTMLButtonElement>(".workout-view button[mat-icon-button]")?.click();
      await fixture.whenStable();
      expect(query("dash-workout-statistics")).toBeNull();
      expect(query("#workout-sessions-grid")).not.toBeNull();
    });
  });
});
