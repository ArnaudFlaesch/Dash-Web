import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpMethod } from '@ngneat/spectator/jest';
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
} from 'date-fns';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { IWorkoutSession, IWorkoutType } from './model/Workout';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service/auth.service';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { WorkoutWidgetComponent } from './workout-widget.component';
import { WorkoutWidgetService } from './workout.widget.service';

describe('WorkoutWidgetComponent', () => {
  let component: WorkoutWidgetComponent;
  let httpTestingController: HttpTestingController;
  const userId = 2;
  const dateFormat = 'yyyy-MM-dd';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule, HttpClientTestingModule],
      providers: [DateUtilsService, WorkoutWidgetService, AuthService, ErrorHandlerService]
    }).compileComponents();

    const fixture = TestBed.createComponent(WorkoutWidgetComponent);
    component = fixture.componentInstance;

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  beforeEach(() => {
    const userData = {
      accessToken: 'accessToken',
      id: userId,
      username: 'admintest',
      email: 'admin@email.com',
      roles: ['ROLE_ADMIN'],
      tokenType: 'Bearer'
    };
    window.localStorage.setItem('user', JSON.stringify(userData));
  });

  it('should create', () => {
    expect(component.workoutTypes).toEqual([]);
    expect(component.workoutSessions).toEqual([]);
    expect(component.isWidgetLoaded).toEqual(false);

    const workoutTypesFromDB = [{ id: 1, name: 'Abdos' }];

    component.refreshWidget();

    const dataRequest = httpTestingController.expectConcurrent([
      {
        url: environment.backend_url + `/workoutWidget/workoutTypes`,
        method: HttpMethod.GET
      },
      {
        url:
          environment.backend_url +
          `/workoutWidget/workoutSessions?dateIntervalStart=${format(
            startOfMonth(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(new Date()), dateFormat)}`,
        method: HttpMethod.GET
      },
      {
        url:
          environment.backend_url +
          `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
            startOfISOWeek(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfWeek(new Date()), dateFormat)}`,
        method: HttpMethod.GET
      },
      {
        url:
          environment.backend_url +
          `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
            startOfMonth(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(new Date()), dateFormat)}`,
        method: HttpMethod.GET
      }
    ]);

    httpTestingController.flushAll(dataRequest, [workoutTypesFromDB, [], [], []]);

    expect(component.isWidgetLoaded).toEqual(true);
    expect(component.workoutTypes).toEqual(workoutTypesFromDB);
    expect(component.workoutSessions.length).toEqual(0);
  });

  it('should add a new workout type', () => {
    expect(component.workoutTypes).toEqual([]);
    expect(component.workoutSessions).toEqual([]);

    component.refreshWidget();

    const dataRequest = httpTestingController.expectConcurrent([
      {
        url: environment.backend_url + `/workoutWidget/workoutTypes`,
        method: HttpMethod.GET
      },
      {
        url:
          environment.backend_url +
          `/workoutWidget/workoutSessions?dateIntervalStart=${format(
            startOfMonth(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(new Date()), dateFormat)}`,
        method: HttpMethod.GET
      },
      {
        url:
          environment.backend_url +
          `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
            startOfMonth(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(new Date()), dateFormat)}`,
        method: HttpMethod.GET
      },
      {
        url:
          environment.backend_url +
          `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
            startOfISOWeek(new Date()),
            dateFormat
          )}&dateIntervalEnd=${format(endOfWeek(new Date()), dateFormat)}`,
        method: HttpMethod.GET
      }
    ]);

    httpTestingController.flushAll(dataRequest, [[], [], [], []]);

    const newWorkoutTypeName = 'Haltères';
    component.workoutNameInput = newWorkoutTypeName;
    component.addWorkoutType();

    const addWorkoutTypeRequest = httpTestingController.expectOne(
      environment.backend_url + '/workoutWidget/addWorkoutType',
      HttpMethod.POST
    );

    const addWorkoutTypeResponse = {
      id: 1,
      name: newWorkoutTypeName
    } as IWorkoutType;
    addWorkoutTypeRequest.flush(addWorkoutTypeResponse);
    expect(component.workoutTypes).toEqual([addWorkoutTypeResponse]);
  });

  it('Should create a new workout session', () => {
    const alreadyExistingWorkoutType = { id: 1, name: 'Abdos' } as IWorkoutType;
    component.workoutTypes = [alreadyExistingWorkoutType];
    const newWorkoutSessionDate = new Date(2022, 8, 1, 0, 0, 0).toString();
    component.workoutDateFormControl.setValue(newWorkoutSessionDate);
    component.createWorkoutSession();

    const addNewWorkoutSessionRequest = httpTestingController.expectOne(
      environment.backend_url + '/workoutWidget/createWorkoutSession',
      HttpMethod.POST
    );

    const mockedAddNewWorkoutSessionResponse = {
      id: 1,
      workoutDate: newWorkoutSessionDate
    } as IWorkoutSession;

    addNewWorkoutSessionRequest.flush(mockedAddNewWorkoutSessionResponse);
    expect(component.workoutSessions).toEqual([mockedAddNewWorkoutSessionResponse]);

    component.editWorkoutSession(mockedAddNewWorkoutSessionResponse);
    expect(component.currentWorkoutSessionToEdit).toEqual(mockedAddNewWorkoutSessionResponse);
    component.backToWorkoutSessionsList();
    expect(component.currentWorkoutSessionToEdit).toEqual(undefined);
  });

  it('Should check month selected', () => {
    const selectedMonth = new Date(2022, 10, 20);
    component.selectMonth(selectedMonth);

    const dataRequest = httpTestingController.expectConcurrent([
      {
        url:
          environment.backend_url +
          `/workoutWidget/workoutSessions?dateIntervalStart=${format(
            startOfMonth(selectedMonth),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(selectedMonth), dateFormat)}`,
        method: HttpMethod.GET
      },
      {
        url:
          environment.backend_url +
          `/workoutWidget/workoutStatsByPeriod?dateIntervalStart=${format(
            startOfMonth(selectedMonth),
            dateFormat
          )}&dateIntervalEnd=${format(endOfMonth(selectedMonth), dateFormat)}`,
        method: HttpMethod.GET
      }
    ]);

    httpTestingController.flushAll(dataRequest, [[], []]);

    expect(component.selectedMonthFormControl.value).toEqual(selectedMonth);
  });

  it('Should switch between statistics views', () => {
    component.goToStatisticsView();
    const today = startOfMonth(new Date());
    const lastThreeMonthsStatsRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          subMonths(today, 2),
          dateFormat
        )}&dateIntervalEnd=${format(endOfMonth(today), dateFormat)}`,
      HttpMethod.GET
    );

    lastThreeMonthsStatsRequest.flush([]);
    expect(component.isLastThreeMonthsWorkoutStatisticsSelected()).toEqual(true);

    component.getWorkoutsStatsOfCurrentYear();
    const currentYearStatsRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          startOfYear(today),
          dateFormat
        )}&dateIntervalEnd=${format(endOfYear(today), dateFormat)}`,
      HttpMethod.GET
    );
    currentYearStatsRequest.flush([]);
    expect(component.isLastThreeMonthsWorkoutStatisticsSelected()).toEqual(false);
    expect(component.isCurrentYearWorkoutStatisticsSelected()).toEqual(true);

    component.getWorkoutsStatsOfLastSixMonths();
    const lastSixMonthsStatsRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          subMonths(today, 5),
          dateFormat
        )}&dateIntervalEnd=${format(endOfMonth(today), dateFormat)}`,
      HttpMethod.GET
    );

    lastSixMonthsStatsRequest.flush([]);
    expect(component.isCurrentYearWorkoutStatisticsSelected()).toEqual(false);
    expect(component.isLastSixMonthsWorkoutStatisticsSelected()).toEqual(true);

    component.getWorkoutsStatsOfPastYear();
    const lastYear = subYears(today, 1);
    const lastYearStatsRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          startOfYear(lastYear),
          dateFormat
        )}&dateIntervalEnd=${format(endOfYear(lastYear), dateFormat)}`,
      HttpMethod.GET
    );

    lastYearStatsRequest.flush([]);
    expect(component.isLastYearWorkoutStatisticsSelected()).toEqual(true);
  });
});
