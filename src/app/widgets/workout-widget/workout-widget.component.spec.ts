import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { IWorkoutSession, IWorkoutType } from './model/Workout';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfISOWeek,
  endOfWeek,
  subMonths,
  subYears
} from 'date-fns';

import { environment } from '../../../environments/environment';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { WorkoutWidgetComponent } from './workout-widget.component';
import { WorkoutWidgetService } from './workout.widget.service';
import { AuthService } from '../../services/auth.service/auth.service';

describe('WorkoutWidgetComponent', () => {
  let spectator: Spectator<WorkoutWidgetComponent>;
  let workoutWidgetService: SpectatorHttp<WorkoutWidgetService>;

  const userId = 2;

  const dateFormat = 'yyyy-MM-dd';

  const createComponent = createComponentFactory({
    component: WorkoutWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [DateUtilsService, WorkoutWidgetService, AuthService, ErrorHandlerService],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(WorkoutWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    workoutWidgetService = createHttp();
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
    expect(spectator.component.workoutTypes).toEqual([]);
    expect(spectator.component.workoutSessions).toEqual([]);
    expect(spectator.component.isWidgetLoaded).toEqual(false);

    const workoutTypesFromDB = [{ id: 1, name: 'Abdos' }];

    spectator.component.refreshWidget();

    const dataRequest = workoutWidgetService.expectConcurrent([
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

    workoutWidgetService.flushAll(dataRequest, [workoutTypesFromDB, [], [], []]);

    expect(spectator.component.isWidgetLoaded).toEqual(true);
    expect(spectator.component.workoutTypes).toEqual(workoutTypesFromDB);
    expect(spectator.component.workoutSessions.length).toEqual(0);
  });

  it('should add a new workout type', () => {
    expect(spectator.component.workoutTypes).toEqual([]);
    expect(spectator.component.workoutSessions).toEqual([]);

    spectator.component.refreshWidget();

    const dataRequest = workoutWidgetService.expectConcurrent([
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

    workoutWidgetService.flushAll(dataRequest, [[], [], [], []]);

    const newWorkoutTypeName = 'Haltères';
    spectator.component.workoutNameInput = newWorkoutTypeName;
    spectator.component.addWorkoutType();

    const addWorkoutTypeRequest = workoutWidgetService.expectOne(
      environment.backend_url + '/workoutWidget/addWorkoutType',
      HttpMethod.POST
    );

    const addWorkoutTypeResponse = {
      id: 1,
      name: newWorkoutTypeName
    } as IWorkoutType;
    addWorkoutTypeRequest.flush(addWorkoutTypeResponse);
    expect(spectator.component.workoutTypes).toEqual([addWorkoutTypeResponse]);
  });

  it('Should create a new workout session', () => {
    const alreadyExistingWorkoutType = { id: 1, name: 'Abdos' } as IWorkoutType;
    spectator.component.workoutTypes = [alreadyExistingWorkoutType];
    const newWorkoutSessionDate = new Date(2022, 8, 1, 0, 0, 0).toString();
    spectator.component.workoutDateFormControl.setValue(newWorkoutSessionDate);
    spectator.component.createWorkoutSession();

    const addNewWorkoutSessionRequest = workoutWidgetService.expectOne(
      environment.backend_url + '/workoutWidget/createWorkoutSession',
      HttpMethod.POST
    );

    const mockedAddNewWorkoutSessionResponse = {
      id: 1,
      workoutDate: newWorkoutSessionDate
    } as IWorkoutSession;

    addNewWorkoutSessionRequest.flush(mockedAddNewWorkoutSessionResponse);
    expect(spectator.component.workoutSessions).toEqual([mockedAddNewWorkoutSessionResponse]);

    spectator.component.editWorkoutSession(mockedAddNewWorkoutSessionResponse);
    expect(spectator.component.currentWorkoutSessionToEdit).toEqual(
      mockedAddNewWorkoutSessionResponse
    );
    spectator.component.backToWorkoutSessionsList();
    expect(spectator.component.currentWorkoutSessionToEdit).toEqual(undefined);
  });

  it('Should check month selected', () => {
    const selectedMonth = new Date(2022, 10, 20);
    spectator.component.selectMonth(selectedMonth);

    const dataRequest = workoutWidgetService.expectConcurrent([
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

    workoutWidgetService.flushAll(dataRequest, [[], []]);

    expect(spectator.component.selectedMonthFormControl.value).toEqual(selectedMonth);
  });

  it('Should switch between statistics views', () => {
    spectator.component.goToStatisticsView();
    const today = startOfMonth(new Date());
    const lastThreeMonthsStatsRequest = workoutWidgetService.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          subMonths(today, 2),
          dateFormat
        )}&dateIntervalEnd=${format(endOfMonth(today), dateFormat)}`,
      HttpMethod.GET
    );

    lastThreeMonthsStatsRequest.flush([]);
    expect(spectator.component.isLastThreeMonthsWorkoutStatisticsSelected()).toEqual(true);

    spectator.component.getWorkoutsStatsOfCurrentYear();
    const currentYearStatsRequest = workoutWidgetService.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          startOfYear(today),
          dateFormat
        )}&dateIntervalEnd=${format(endOfYear(today), dateFormat)}`,
      HttpMethod.GET
    );
    currentYearStatsRequest.flush([]);
    expect(spectator.component.isLastThreeMonthsWorkoutStatisticsSelected()).toEqual(false);
    expect(spectator.component.isCurrentYearWorkoutStatisticsSelected()).toEqual(true);

    spectator.component.getWorkoutsStatsOfLastSixMonths();
    const lastSixMonthsStatsRequest = workoutWidgetService.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          subMonths(today, 5),
          dateFormat
        )}&dateIntervalEnd=${format(endOfMonth(today), dateFormat)}`,
      HttpMethod.GET
    );

    lastSixMonthsStatsRequest.flush([]);
    expect(spectator.component.isCurrentYearWorkoutStatisticsSelected()).toEqual(false);
    expect(spectator.component.isLastSixMonthsWorkoutStatisticsSelected()).toEqual(true);

    spectator.component.getWorkoutsStatsOfPastYear();
    const lastYear = subYears(today, 1);
    const lastYearStatsRequest = workoutWidgetService.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutStatsByMonth?dateIntervalStart=${format(
          startOfYear(lastYear),
          dateFormat
        )}&dateIntervalEnd=${format(endOfYear(lastYear), dateFormat)}`,
      HttpMethod.GET
    );

    lastYearStatsRequest.flush([]);
    expect(spectator.component.isLastYearWorkoutStatisticsSelected()).toEqual(true);
  });
});
