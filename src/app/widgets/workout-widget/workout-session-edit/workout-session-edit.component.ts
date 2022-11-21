import {
  IWorkoutExercise,
  IWorkoutSession,
  IWorkoutType
} from './../model/Workout';
import { Component, Input, SimpleChanges } from '@angular/core';
import { ErrorHandlerService } from '../../../services/error.handler.service';
import { WorkoutWidgetService } from '../workout.widget.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-workout-session-edit',
  templateUrl: './workout-session-edit.component.html',
  styleUrls: ['./workout-session-edit.component.scss']
})
export class WorkoutSessionEditComponent {
  @Input() public workoutTypes: IWorkoutType[] = [];
  @Input() public currentWorkoutSessionToEdit: IWorkoutSession | undefined;

  public workoutExercises: IWorkoutExercise[] = [];

  private ERROR_CREATING_WORKOUT_EXERCISE =
    "Erreur lors de l'ajout d'un exercice.";

  private ERROR_GETTING_WORKOUT_EXERCISES =
    'Erreur lors de la récupération des exercices.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private workoutWidgetService: WorkoutWidgetService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentWorkoutSessionToEdit'].currentValue)
      this.fetchWorkoutExercisesBySessionId(
        changes['currentWorkoutSessionToEdit'].currentValue.id
      );
  }

  public decrementExerciceNumberOfReps(workoutTypeId: number): void {
    this.updateNumberOfReps(workoutTypeId, -1);
  }

  public incrementExerciceNumberOfReps(workoutTypeId: number): void {
    this.updateNumberOfReps(workoutTypeId, 1);
  }

  public getExerciceNumberOfReps(workoutTypeId: number): number {
    const workoutType = this.workoutExercises.find(
      (workoutExercise) => workoutExercise.workoutTypeId === workoutTypeId
    );
    if (workoutType) {
      return workoutType.numberOfReps;
    } else return 0;
  }

  private fetchWorkoutExercisesBySessionId(workoutSessionId: number): void {
    this.workoutWidgetService.getWorkoutExercises(workoutSessionId).subscribe({
      next: (workoutExercises) => (this.workoutExercises = workoutExercises),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(
          error.message,
          this.ERROR_GETTING_WORKOUT_EXERCISES
        )
    });
  }

  private updateWorkoutExercise(
    workoutSessionId: number,
    workoutTypeId: number,
    numberOfReps: number
  ): void {
    this.workoutWidgetService
      .updateWorkoutExercise(workoutSessionId, workoutTypeId, numberOfReps)
      .subscribe({
        next: (addedWorkoutExercise) =>
          (this.workoutExercises = [
            ...this.workoutExercises.filter(
              (ex) => ex.workoutTypeId !== workoutTypeId
            ),
            addedWorkoutExercise
          ]),
        error: (error) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_CREATING_WORKOUT_EXERCISE
          )
      });
  }

  private updateNumberOfReps(
    workoutTypeId: number,
    numberOfRepsToAdd: number
  ): void {
    const oldNumberOfReps = this.getExerciceNumberOfReps(workoutTypeId);
    if (this.currentWorkoutSessionToEdit) {
      this.updateWorkoutExercise(
        this.currentWorkoutSessionToEdit.id,
        workoutTypeId,
        oldNumberOfReps + numberOfRepsToAdd
      );
    }
  }
}
