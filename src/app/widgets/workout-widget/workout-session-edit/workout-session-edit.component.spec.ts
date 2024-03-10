import { MatSnackBarModule } from '@angular/material/snack-bar';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { ErrorHandlerService } from '../../../services/error.handler.service';
import { IWorkoutExercise, IWorkoutSession, IWorkoutType } from '../model/Workout';
import { WorkoutWidgetService } from '../workout.widget.service';
import { WorkoutSessionEditComponent } from './workout-session-edit.component';

describe('WorkoutSessionEditComponent', () => {
  let component: WorkoutSessionEditComponent;
  let fixture: ComponentFixture<WorkoutSessionEditComponent>;
  let httpTestingController: HttpTestingController;

  const workoutTypes = [{ id: 1, name: 'Abdos' } as IWorkoutType];
  const newWorkoutSessionDate = new Date(2022, 8, 1, 0, 0, 0).toString();
  const currentWorkoutSessionToEdit = {
    id: 1,
    workoutDate: newWorkoutSessionDate
  } as IWorkoutSession;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule, DateFormatPipe, HttpClientTestingModule],
      providers: [WorkoutWidgetService, ErrorHandlerService]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutSessionEditComponent);
    component = fixture.componentInstance;
    component.workoutTypes = workoutTypes;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should add a rep to an exercise', () => {
    component.currentWorkoutSessionToEdit = currentWorkoutSessionToEdit;
    component.ngOnChanges({
      currentWorkoutSessionToEdit: new SimpleChange(null, currentWorkoutSessionToEdit, true)
    });
    fixture.detectChanges();
    const getWorkoutExercisesRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutExercises?workoutSessionId=${currentWorkoutSessionToEdit.id}`
    );
    getWorkoutExercisesRequest.flush([]);
    const workoutTypeIdToEdit = workoutTypes[0].id;
    expect(component.workoutExercises).toEqual([]);

    expect(component.getExerciceNumberOfReps(workoutTypeIdToEdit)).toEqual(0);
    component.incrementExerciceNumberOfReps(workoutTypeIdToEdit);
    const incrementWorkoutExerciseRequest = httpTestingController.expectOne(
      environment.backend_url + `/workoutWidget/updateWorkoutExercise`
    );
    incrementWorkoutExerciseRequest.flush({
      workoutSessionId: currentWorkoutSessionToEdit.id,
      workoutTypeId: workoutTypeIdToEdit,
      numberOfReps: 1
    } as IWorkoutExercise);

    expect(component.getExerciceNumberOfReps(workoutTypeIdToEdit)).toEqual(1);

    component.decrementExerciceNumberOfReps(workoutTypeIdToEdit);
    const decrementWorkoutExerciseRequest = httpTestingController.expectOne(
      environment.backend_url + `/workoutWidget/updateWorkoutExercise`
    );
    decrementWorkoutExerciseRequest.flush({
      workoutSessionId: currentWorkoutSessionToEdit.id,
      workoutTypeId: workoutTypeIdToEdit,
      numberOfReps: 0
    } as IWorkoutExercise);

    expect(component.getExerciceNumberOfReps(workoutTypeIdToEdit)).toEqual(0);
  });
});
