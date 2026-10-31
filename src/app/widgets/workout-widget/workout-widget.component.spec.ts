import { WIDGET_ID } from "../widget.tokens";
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
import { ErrorHandlerService } from "../../services/error.handler.service";
import { IWorkoutSession, IWorkoutType } from "./model/Workout";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../services/auth.service/auth.service";
import { DateUtilsService } from "../../services/date.utils.service/date.utils.service";
import { WidgetService } from "../../services/widget.service/widget.service";
import { WorkoutWidgetComponent } from "./workout-widget.component";
import { WorkoutWidgetService } from "./workout.widget.service";
import { provideHttpClient } from "@angular/common/http";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { provideDateFnsAdapter } from "@angular/material-date-fns-adapter";
import { fr } from "date-fns/locale";

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
        DateUtilsService,
        WorkoutWidgetService,
        AuthService,
        ErrorHandlerService,
        WidgetService,
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
    expect(component.workoutSessions().length).toEqual(0);
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
    expect(component.currentWorkoutSessionToEdit()).toEqual(undefined);
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
    fixture.detectChanges();

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

    expect(element.querySelectorAll(".workout-session").length).toEqual(1);
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
    expect(periods.length).toEqual(4);
    expect(periods[0].classList).toContain("selected");
  });
});
