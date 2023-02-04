import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createHostFactory,
  createHttpFactory,
  HttpMethod,
  SpectatorHost,
  SpectatorHttp
} from '@ngneat/spectator/jest';

import { environment } from '../../../../environments/environment';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { ErrorHandlerService } from '../../../services/error.handler.service';
import { IWorkoutExercise, IWorkoutSession, IWorkoutType } from '../model/Workout';
import { WorkoutWidgetService } from '../workout.widget.service';
import { WorkoutSessionEditComponent } from './workout-session-edit.component';

describe('WorkoutSessionEditComponent', () => {
  let spectator: SpectatorHost<WorkoutSessionEditComponent>;
  let workoutWidgetService: SpectatorHttp<WorkoutWidgetService>;

  const createHost = createHostFactory({
    component: WorkoutSessionEditComponent,
    imports: [MatSnackBarModule],
    providers: [WorkoutWidgetService, ErrorHandlerService],
    declarations: [DateFormatPipe]
  });

  const createHttp = createHttpFactory(WorkoutWidgetService);

  const workoutTypes = [{ id: 1, name: 'Abdos' } as IWorkoutType];
  const newWorkoutSessionDate = new Date(2022, 8, 1, 0, 0, 0).toString();
  const currentWorkoutSessionToEdit = {
    id: 1,
    workoutDate: newWorkoutSessionDate
  } as IWorkoutSession;

  beforeEach(() => {
    spectator = createHost(
      `<app-workout-session-edit [workoutTypes]="workoutTypes" [currentWorkoutSessionToEdit]="currentWorkoutSessionToEdit"></app-workout-session-edit>`,
      {
        hostProps: {
          workoutTypes: workoutTypes,
          currentWorkoutSessionToEdit: currentWorkoutSessionToEdit
        }
      }
    );
    workoutWidgetService = createHttp();
  });

  it('should add a rep to an exercise', () => {
    const getWorkoutExercisesRequest = workoutWidgetService.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutExercises?workoutSessionId=${currentWorkoutSessionToEdit.id}`,
      HttpMethod.GET
    );
    getWorkoutExercisesRequest.flush([]);
    const workoutTypeIdToEdit = workoutTypes[0].id;
    expect(spectator.component.workoutExercises).toEqual([]);

    expect(spectator.component.getExerciceNumberOfReps(workoutTypeIdToEdit)).toEqual(0);
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

    expect(spectator.component.getExerciceNumberOfReps(workoutTypeIdToEdit)).toEqual(1);

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

    expect(spectator.component.getExerciceNumberOfReps(workoutTypeIdToEdit)).toEqual(0);
  });
});
