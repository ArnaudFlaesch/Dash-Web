import { IWorkoutType } from './model/Workout';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  Spectator,
  SpectatorHttp,
  createComponentFactory,
  createHttpFactory,
  HttpMethod
} from '@ngneat/spectator';
import { ErrorHandlerService } from '../../services/error.handler.service';

import { WorkoutWidgetComponent } from './workout-widget.component';
import { WorkoutWidgetService } from './workout.widget.service';
import { environment } from '../../../environments/environment';
import { DateUtilsService } from '../../services/date.utils';

describe('WorkoutWidgetComponent', () => {
  let spectator: Spectator<WorkoutWidgetComponent>;
  let workoutWidgetService: SpectatorHttp<WorkoutWidgetService>;

  const createComponent = createComponentFactory({
    component: WorkoutWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [DateUtilsService, WorkoutWidgetService, ErrorHandlerService],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(WorkoutWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    workoutWidgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component.workoutTypes).toEqual([]);
    expect(spectator.component.workoutSessions).toEqual([]);

    const workoutTypesFromDB = [{ id: 1, name: 'Abdos' }];

    spectator.component.refreshWidget();

    const dataRequest = workoutWidgetService.expectConcurrent([
      {
        url: environment.backend_url + '/workoutWidget/workoutTypes',
        method: HttpMethod.GET
      },
      {
        url: environment.backend_url + '/workoutWidget/workoutSessions',
        method: HttpMethod.GET
      }
    ]);

    workoutWidgetService.flushAll(dataRequest, [workoutTypesFromDB, []]);

    expect(spectator.component.workoutTypes).toEqual(workoutTypesFromDB);
    expect(spectator.component.workoutSessions.length).toEqual(0);
  });

  it('should add a new workout type', () => {
    expect(spectator.component.workoutTypes).toEqual([]);
    expect(spectator.component.workoutSessions).toEqual([]);

    spectator.component.refreshWidget();

    const dataRequest = workoutWidgetService.expectConcurrent([
      {
        url: environment.backend_url + '/workoutWidget/workoutTypes',
        method: HttpMethod.GET
      },
      {
        url: environment.backend_url + '/workoutWidget/workoutSessions',
        method: HttpMethod.GET
      }
    ]);

    const newWorkoutTypeName = 'Haltères';
    workoutWidgetService.flushAll(dataRequest, [[], []]);

    spectator.component.workoutNameInput = newWorkoutTypeName;
    spectator.component.addWorkoutType();

    const addWorkoutTypeRequest = workoutWidgetService.expectOne(
      environment.backend_url + '/workoutWidget/addWorkoutType',
      HttpMethod.POST
    );

    const addWorkoutTypeResponse = { id: 1, name: newWorkoutTypeName } as IWorkoutType;
    addWorkoutTypeRequest.flush(addWorkoutTypeResponse);
    expect(spectator.component.workoutTypes).toEqual([addWorkoutTypeResponse]);
  });
});
