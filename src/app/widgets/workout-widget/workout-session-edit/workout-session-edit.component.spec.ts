import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator';
import { environment } from '../../../../environments/environment';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';

import { ErrorHandlerService } from '../../../services/error.handler.service';
import {
  IWorkoutExercise,
  IWorkoutSession,
  IWorkoutType
} from '../model/Workout';
import { WorkoutWidgetService } from '../workout.widget.service';
import { WorkoutSessionEditComponent } from './workout-session-edit.component';

describe('WorkoutSessionEditComponent', () => {
  let spectator: Spectator<WorkoutSessionEditComponent>;
  let workoutWidgetService: SpectatorHttp<WorkoutWidgetService>;

  const createComponent = createComponentFactory({
    component: WorkoutSessionEditComponent,
    imports: [MatSnackBarModule],
    providers: [WorkoutWidgetService, ErrorHandlerService],
    declarations: [DateFormatPipe],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(WorkoutWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    workoutWidgetService = createHttp();
  });

  it('should add a rep to an exercise', () => {
    const workoutTypes = [{ id: 1, name: 'Abdos' } as IWorkoutType];
    const workoutTypeIdToEdit = workoutTypes[0].id;
    const newWorkoutSessionDate = new Date(2022, 8, 1, 0, 0, 0).toString();
    const currentWorkoutSessionToEdit = {
      id: 1,
      workoutDate: newWorkoutSessionDate
    } as IWorkoutSession;

    expect(spectator.component.workoutExercises).toEqual([]);

    spectator.component.workoutTypes = workoutTypes;
    spectator.component.currentWorkoutSessionToEdit =
      currentWorkoutSessionToEdit;
    spectator.fixture.detectChanges();

    expect(
      spectator.component.getExerciceNumberOfReps(workoutTypeIdToEdit)
    ).toEqual(0);
    spectator.component.incrementExerciceNumberOfReps(workoutTypeIdToEdit);
    const incrementWorkoutExerciseRequest = workoutWidgetService.expectOne(
      environment.backend_url + `/workoutWidget/updateWorkoutExercise`,
      HttpMethod.POST
    );
    incrementWorkoutExerciseRequest.flush({
      workoutSessionId: currentWorkoutSessionToEdit.id,
      workoutTypeId: workoutTypeIdToEdit,
      numberOfReps: 1
    } as IWorkoutExercise);

    expect(
      spectator.component.getExerciceNumberOfReps(workoutTypeIdToEdit)
    ).toEqual(1);

    spectator.component.decrementExerciceNumberOfReps(workoutTypeIdToEdit);
    const decrementWorkoutExerciseRequest = workoutWidgetService.expectOne(
      environment.backend_url + `/workoutWidget/updateWorkoutExercise`,
      HttpMethod.POST
    );
    decrementWorkoutExerciseRequest.flush({
      workoutSessionId: currentWorkoutSessionToEdit.id,
      workoutTypeId: workoutTypeIdToEdit,
      numberOfReps: 0
    } as IWorkoutExercise);

    expect(
      spectator.component.getExerciceNumberOfReps(workoutTypeIdToEdit)
    ).toEqual(0);
  });
});
