import { WIDGET_ID } from "@widgets/widget.tokens";
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
import { ErrorHandlerService } from "@services/error-handler.service";
import { IWorkoutSession, IWorkoutType, WORKOUT_WIDGET_VIEW } from "./model/Workout";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { WorkoutWidgetComponent } from "./workout-widget.component";
import { provideHttpClient } from "@angular/common/http";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { provideDateFnsAdapter } from "@angular/material-date-fns-adapter";
import { fr } from "date-fns/locale";
import { MatDatepicker } from "@angular/material/datepicker";

describe("WorkoutWidgetComponent", () => {
  let component: WorkoutWidgetComponent;
  let httpTestingController: HttpTestingController;
  const userId = 2;
  const dateFormat = "yyyy-MM-dd";

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: 1 }
      ]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(WorkoutWidgetComponent, "")
      .compileComponents();

    const fixture = TestBed.createComponent(WorkoutWidgetComponent);
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

  beforeEach(() => {
    const userData = {
      accessToken: "accessToken",
      id: userId,
      username: "admintest",
      email: "admin@email.com",
      roles: ["ROLE_ADMIN"],
      tokenType: "Bearer"
    };
    window.localStorage.setItem("user", JSON.stringify(userData));
  });

  it("should create", async () => {
    expect(component.workoutTypes()).toEqual([]);
    expect(component.workoutSessions()).toEqual([]);
    expect(component.isWidgetLoaded()).toEqual(false);

    const workoutTypesFromDB = [{ id: 1, name: "Abdos" }];

    component.refreshWidget();
    TestBed.tick();

    const workoutTypesRequest = httpTestingController.expectOne(
      environment.backend_url + `/workoutWidget/workoutTypes`
    );
    workoutTypesRequest.flush(workoutTypesFromDB);
    await flushResources();
    const workoutSessionsRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutSessions?dateIntervalStart=${format(
          startOfMonth(new Date()),
          dateFormat
        )}&dateIntervalEnd=${format(endOfMonth(new Date()), dateFormat)}`
    );
    workoutSessionsRequest.flush([]);
    await flushResources();
    const workoutStatsWeekRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
          startOfISOWeek(new Date()),
          dateFormat
        )}&dateIntervalEnd=${format(endOfWeek(new Date()), dateFormat)}`
    );
    workoutStatsWeekRequest.flush([]);
    await flushResources();
    const workoutStatsMonthRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
          startOfMonth(new Date()),
          dateFormat
        )}&dateIntervalEnd=${format(endOfMonth(new Date()), dateFormat)}`
    );
    workoutStatsMonthRequest.flush([]);
    await flushResources();

    expect(component.isWidgetLoaded()).toEqual(true);
    expect(component.workoutTypes()).toEqual(workoutTypesFromDB);
    expect(component.workoutSessions()).toHaveLength(0);
  });

  it("should add a new workout type", () => {
    const newWorkoutTypeName = "Haltères";
    component.workoutNameInput.set(newWorkoutTypeName);
    component.addWorkoutType();

    const addWorkoutTypeRequest = httpTestingController.expectOne(
      environment.backend_url + "/workoutWidget/addWorkoutType"
    );

    const addWorkoutTypeResponse = {
      id: 1,
      name: newWorkoutTypeName
    } as IWorkoutType;
    addWorkoutTypeRequest.flush(addWorkoutTypeResponse);
    expect(component.workoutTypes()).toEqual([addWorkoutTypeResponse]);
  });

  it("Should create widget with errors from webservices", async () => {
    expect(component.workoutTypes()).toEqual([]);
    expect(component.workoutSessions()).toEqual([]);

    component.refreshWidget();
    TestBed.tick();

    httpTestingController
      .expectOne(environment.backend_url + `/workoutWidget/workoutTypes`)
      .error(new ProgressEvent("Server error"));
    await flushResources();

    httpTestingController
      .expectOne(
        environment.backend_url +
          `/workoutWidget/workoutSessions?dateIntervalStart=${format(
            startOfMonth(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(new Date()), dateFormat)}`
      )
      .error(new ProgressEvent("Server error"));
    await flushResources();

    httpTestingController
      .expectOne(
        environment.backend_url +
          `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
            startOfISOWeek(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfWeek(new Date()), dateFormat)}`
      )
      .error(new ProgressEvent("Server error"));
    await flushResources();

    httpTestingController
      .expectOne(
        environment.backend_url +
          `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
            startOfMonth(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(new Date()), dateFormat)}`
      )
      .error(new ProgressEvent("Server error"));
    await flushResources();
  });

  it("Should create a new workout session", () => {
    const alreadyExistingWorkoutType = { id: 1, name: "Abdos" } as IWorkoutType;
    component.workoutTypes.set([alreadyExistingWorkoutType]);
    const newWorkoutSessionDate = new Date(2022, 8, 1, 0, 0, 0).toString();
    component.workoutDateInput.set(newWorkoutSessionDate);
    component.createWorkoutSession();

    const addNewWorkoutSessionRequest = httpTestingController.expectOne(
      environment.backend_url + "/workoutWidget/createWorkoutSession"
    );

    const mockedAddNewWorkoutSessionResponse = {
      id: 1,
      workoutDate: newWorkoutSessionDate
    } as IWorkoutSession;

    addNewWorkoutSessionRequest.flush(mockedAddNewWorkoutSessionResponse);
    expect(component.workoutSessions()).toEqual([mockedAddNewWorkoutSessionResponse]);

    component.editWorkoutSession(mockedAddNewWorkoutSessionResponse);
    expect(component.currentWorkoutSessionToEdit()).toEqual(mockedAddNewWorkoutSessionResponse);
    component.backToWorkoutSessionsList();
    expect(component.currentWorkoutSessionToEdit()).toBeUndefined();
  });

  it("Should handle the errors when adding a workout type or creating a session", () => {
    const errorHandlerService = TestBed.inject(ErrorHandlerService);
    const handleErrorSpy = vi
      .spyOn(errorHandlerService, "handleError")
      .mockImplementation(() => undefined);

    component.workoutNameInput.set("Pompes");
    component.addWorkoutType();
    httpTestingController
      .expectOne(environment.backend_url + "/workoutWidget/addWorkoutType")
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la création d'un type d'exercice."
    );
    expect(component.workoutTypes()).toEqual([]);
    // The input is kept, so that the user can try again
    expect(component.workoutNameInput()).toEqual("Pompes");

    component.workoutDateInput.set(new Date(2022, 8, 1).toString());
    component.createWorkoutSession();
    httpTestingController
      .expectOne(environment.backend_url + "/workoutWidget/createWorkoutSession")
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la création d'une session d'exercices."
    );
    expect(component.workoutSessions()).toEqual([]);
    expect(component.currentWorkoutSessionToEdit()).toBeUndefined();
  });

  it("Should not send invalid forms", () => {
    component.workoutNameInput.set("   ");
    component.addWorkoutType();
    component.workoutDateInput.set("");
    component.createWorkoutSession();

    expect(
      httpTestingController.match(environment.backend_url + "/workoutWidget/addWorkoutType")
    ).toHaveLength(0);
    expect(
      httpTestingController.match(environment.backend_url + "/workoutWidget/createWorkoutSession")
    ).toHaveLength(0);
  });

  it("Should select the month picked in the datepicker, then close it", () => {
    const datepicker = { close: vi.fn() } as unknown as MatDatepicker<Date>;
    component.setMonthAndYear(new Date(2022, 10, 20), datepicker);

    expect(component.selectedMonthInput()).toEqual(new Date(2022, 10, 1));
    expect(datepicker.close).toHaveBeenCalled();
  });

  it("Should check month selected", async () => {
    const selectedMonth = new Date(2022, 10, 20);
    component.refreshWidget();
    component.selectMonth(selectedMonth);
    TestBed.tick();
    httpTestingController
      .expectOne(environment.backend_url + "/workoutWidget/workoutTypes")
      .flush([]);
    await flushResources();
    httpTestingController
      .expectOne(
        environment.backend_url +
          `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
            startOfISOWeek(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfWeek(new Date()), dateFormat)}`
      )
      .flush([]);
    await flushResources();

    const workoutStatsWeekRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutSessions?dateIntervalStart=${format(
          startOfMonth(selectedMonth),
          dateFormat
        )}&dateIntervalEnd=${format(endOfMonth(selectedMonth), dateFormat)}`
    );
    workoutStatsWeekRequest.flush([]);
    await flushResources();
    const workoutStatsMonthRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
          startOfMonth(selectedMonth),
          dateFormat
        )}&dateIntervalEnd=${format(endOfMonth(selectedMonth), dateFormat)}`
    );
    workoutStatsMonthRequest.flush([]);
    await flushResources();

    expect(component.selectedMonthInput()).toEqual(selectedMonth);
  });

  it("Should switch between statistics views", async () => {
    component.goToStatisticsView();
    TestBed.tick();
    const today = startOfMonth(new Date());
    const lastThreeMonthsStatsRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          subMonths(today, 2),
          dateFormat
        )}&dateIntervalEnd=${format(endOfMonth(today), dateFormat)}`
    );

    lastThreeMonthsStatsRequest.flush([]);
    await flushResources();
    expect(component.isLastThreeMonthsWorkoutStatisticsSelected()).toEqual(true);

    component.getWorkoutsStatsOfCurrentYear();
    TestBed.tick();
    const currentYearStatsRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          startOfYear(today),
          dateFormat
        )}&dateIntervalEnd=${format(endOfYear(today), dateFormat)}`
    );
    currentYearStatsRequest.flush([]);
    await flushResources();
    expect(component.isLastThreeMonthsWorkoutStatisticsSelected()).toEqual(false);
    expect(component.isCurrentYearWorkoutStatisticsSelected()).toEqual(true);

    component.getWorkoutsStatsOfLastSixMonths();
    TestBed.tick();
    const lastSixMonthsStatsRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          subMonths(today, 5),
          dateFormat
        )}&dateIntervalEnd=${format(endOfMonth(today), dateFormat)}`
    );

    lastSixMonthsStatsRequest.flush([]);
    await flushResources();
    expect(component.isCurrentYearWorkoutStatisticsSelected()).toEqual(false);
    expect(component.isLastSixMonthsWorkoutStatisticsSelected()).toEqual(true);

    component.getWorkoutsStatsOfPastYear();
    TestBed.tick();
    const lastYear = subYears(today, 1);
    const lastYearStatsRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          startOfYear(lastYear),
          dateFormat
        )}&dateIntervalEnd=${format(endOfYear(lastYear), dateFormat)}`
    );

    lastYearStatsRequest.flush([]);
    await flushResources();
    expect(component.isLastYearWorkoutStatisticsSelected()).toEqual(true);
  });
});

describe("WorkoutWidgetComponent rendering", () => {
  const dateFormat = "yyyy-MM-dd";
  let httpTestingController: HttpTestingController;

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

  function expectStatsByPeriodRequest(
    start: Date,
    end: Date
  ): ReturnType<HttpTestingController["expectOne"]> {
    return httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(start, dateFormat)}&dateIntervalEnd=${format(end, dateFormat)}`
    );
  }

  it("should display the sessions, the statistics and the workout types", async () => {
    const fixture = TestBed.createComponent(WorkoutWidgetComponent);
    const element: HTMLElement = fixture.nativeElement;
    TestBed.tick();

    httpTestingController
      .expectOne(environment.backend_url + "/workoutWidget/workoutTypes")
      .flush([{ id: 1, name: "Abdos", userId: 2 }]);
    await flushResources();
    httpTestingController
      .expectOne(
        environment.backend_url +
          `/workoutWidget/workoutSessions?dateIntervalStart=${format(
            startOfMonth(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(new Date()), dateFormat)}`
      )
      .flush([{ id: 1, workoutDate: "2026-10-20", userId: 2 }]);
    await flushResources();
    const stats = [{ workoutTypeName: "Abdos", totalNumberOfReps: 50 }];
    expectStatsByPeriodRequest(startOfISOWeek(new Date()), endOfWeek(new Date())).flush(stats);
    await flushResources();
    expectStatsByPeriodRequest(startOfMonth(new Date()), endOfMonth(new Date())).flush(stats);
    await flushResources();
    await fixture.whenStable();

    expect(element.querySelectorAll(".workout-session")).toHaveLength(1);
    expect(
      element.querySelector("#workout-stats-by-week-container .workout-stat-reps")?.textContent
    ).toContain("50");
    expect(element.querySelector("#workout-stats-by-month-container")).not.toBeNull();
    expect(element.querySelector("#workout-types-grid .workout-type-name")?.textContent).toContain(
      "Abdos"
    );

    fixture.componentInstance.goToStatisticsView();
    TestBed.tick();
    const today = startOfMonth(new Date());
    httpTestingController
      .expectOne(
        environment.backend_url +
          `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
            subMonths(today, 2),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(today), dateFormat)}`
      )
      .flush([]);
    await flushResources();
    await fixture.whenStable();

    const periods = element.querySelectorAll(".workout-period");
    expect(periods).toHaveLength(4);
    expect(periods[0].classList).toContain("selected");
  });

  /** Creates the widget, and answers its first requests. */
  async function createWidget(
    workoutTypes: IWorkoutType[],
    workoutSessions: IWorkoutSession[]
  ): Promise<{ fixture: ComponentFixture<WorkoutWidgetComponent>; element: HTMLElement }> {
    const fixture = TestBed.createComponent(WorkoutWidgetComponent);
    TestBed.tick();
    httpTestingController
      .expectOne(environment.backend_url + "/workoutWidget/workoutTypes")
      .flush(workoutTypes);
    httpTestingController
      .expectOne(
        environment.backend_url +
          `/workoutWidget/workoutSessions?dateIntervalStart=${format(
            startOfMonth(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(new Date()), dateFormat)}`
      )
      .flush(workoutSessions);
    expectStatsByPeriodRequest(startOfISOWeek(new Date()), endOfWeek(new Date())).flush([]);
    expectStatsByPeriodRequest(startOfMonth(new Date()), endOfMonth(new Date())).flush([]);
    await flushResources();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it("should display the empty states", async () => {
    const { fixture, element } = await createWidget([], []);
    const labels = fixture.componentInstance.labels;

    const emptyMessages = element.querySelectorAll(".workout-empty-message");
    expect(emptyMessages).toHaveLength(2);
    expect(emptyMessages[0].textContent).toContain(labels.noSessionThisMonth);
    expect(emptyMessages[1].textContent).toContain(labels.noWorkoutType);
    expect(element.querySelector(".workout-stats-cards")).toBeNull();
    expect(element.querySelector(".workout-session")).toBeNull();
    // The forms are empty, so they cannot be submitted
    expect(
      (element.querySelector("#create-workout-session-button") as HTMLButtonElement).disabled
    ).toBe(true);
    expect((element.querySelector("#add-workout-type-button") as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it("should add a workout type from the input", async () => {
    const { fixture, element } = await createWidget([], []);
    const input = element.querySelector("#add-workout-input") as HTMLInputElement;
    const addButton = element.querySelector("#add-workout-type-button") as HTMLButtonElement;

    input.value = "Pompes";
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    expect(addButton.disabled).toBe(false);
    addButton.click();

    const addWorkoutTypeRequest = httpTestingController.expectOne(
      environment.backend_url + "/workoutWidget/addWorkoutType"
    );
    expect(addWorkoutTypeRequest.request.body).toEqual({ workoutType: "Pompes" });
    addWorkoutTypeRequest.flush({ id: 3, name: "Pompes", userId: 2 });
    await fixture.whenStable();

    expect(element.querySelector("#workout-types-grid .workout-type-name")?.textContent).toContain(
      "Pompes"
    );
    expect(fixture.componentInstance.workoutNameInput()).toEqual("");
    expect(addButton.disabled).toBe(true);
  });

  it("should edit a session, then go back to the sessions list", async () => {
    const { fixture, element } = await createWidget(
      [{ id: 1, name: "Abdos", userId: 2 }],
      [{ id: 7, workoutDate: "2026-10-20", userId: 2 }]
    );

    (element.querySelector(".workout-session") as HTMLButtonElement).click();
    TestBed.tick();
    httpTestingController
      .expectOne(environment.backend_url + "/workoutWidget/workoutExercises?workoutSessionId=7")
      .flush([{ workoutTypeId: 1, numberOfReps: 5 }]);
    await fixture.whenStable();

    expect(fixture.componentInstance.widgetView()).toEqual(
      WORKOUT_WIDGET_VIEW.EDIT_WORKOUT_SESSION_VIEW
    );
    expect(element.querySelector("dash-workout-session-edit")).not.toBeNull();
    expect(element.querySelector(".workout-number-of-reps")?.textContent).toContain("5");
    expect(element.querySelector(".workout-back-button")?.textContent).toContain(
      fixture.componentInstance.labels.sessions
    );

    (element.querySelector(".workout-back-button") as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(fixture.componentInstance.currentWorkoutSessionToEdit()).toBeUndefined();
    expect(element.querySelector("dash-workout-session-edit")).toBeNull();
    expect(element.querySelectorAll(".workout-session")).toHaveLength(1);
  });

  it("should select the period of the statistics, then go back to the sessions list", async () => {
    const { fixture, element } = await createWidget([], []);
    const today = startOfMonth(new Date());
    const statsByMonthUrl = (start: Date, end: Date): string =>
      environment.backend_url +
      `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(start, dateFormat)}&dateIntervalEnd=${format(end, dateFormat)}`;

    const statisticsButton = Array.from(element.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(fixture.componentInstance.labels.statistics)
    ) as HTMLButtonElement;
    statisticsButton.click();
    TestBed.tick();
    httpTestingController
      .expectOne(statsByMonthUrl(subMonths(today, 2), endOfMonth(today)))
      .flush([]);
    await flushResources();
    await fixture.whenStable();
    expect(element.querySelector("dash-workout-statistics")).not.toBeNull();

    const periods = element.querySelectorAll<HTMLButtonElement>(".workout-period");
    expect(periods[0].textContent).toContain(fixture.componentInstance.labels.lastThreeMonths);
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
    expect(periods[2].classList).toContain("selected");

    periods[3].click();
    TestBed.tick();
    const lastYear = subYears(today, 1);
    httpTestingController
      .expectOne(statsByMonthUrl(startOfYear(lastYear), endOfYear(lastYear)))
      .flush([]);
    await flushResources();
    await fixture.whenStable();
    expect(periods[3].classList).toContain("selected");

    const backButton = element.querySelector(
      ".workout-view button[mat-icon-button]"
    ) as HTMLButtonElement;
    backButton.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.widgetView()).toEqual(
      WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW
    );
    expect(element.querySelector("dash-workout-statistics")).toBeNull();
  });
});
