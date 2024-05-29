import { IWorkoutExercise, IWorkoutSession, IWorkoutType } from './../model/Workout';
import { Component, Input, SimpleChanges } from '@angular/core';
import { ErrorHandlerService } from '../../../services/error.handler.service';
import { WorkoutWidgetService } from '../workout.widget.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { NgClass } from '@angular/common';

@Component({
  selector: 'dash-workout-session-edit',
  templateUrl: './workout-session-edit.component.html',
  styleUrls: ['./workout-session-edit.component.scss'],
  standalone: true,
  imports: [MatIconButton, MatIcon, NgClass, MatProgressSpinner, DateFormatPipe]
})
export class WorkoutSessionEditComponent {
  @Input() public workoutTypes: IWorkoutType[] = [];
  @Input() public currentWorkoutSessionToEdit: IWorkoutSession | undefined;

  public workoutExercises: IWorkoutExercise[] = [];

  public sessionEditMode = false;
  public isWidgetUpdating = false;
  public workoutExercisesLoaded = false;

  private ERROR_CREATING_WORKOUT_EXERCISE = "Erreur lors de l'ajout d'un exercice.";
  private ERROR_GETTING_WORKOUT_EXERCISES = 'Erreur lors de la récupération des exercices.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private workoutWidgetService: WorkoutWidgetService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentWorkoutSessionToEdit'].currentValue)
      this.fetchWorkoutExercisesBySessionId(changes['currentWorkoutSessionToEdit'].currentValue.id);
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

  public toggleSessionEditMode(): void {
    this.sessionEditMode = !this.sessionEditMode;
  }

  private fetchWorkoutExercisesBySessionId(workoutSessionId: number): void {
    this.workoutExercisesLoaded = false;
    this.workoutWidgetService.getWorkoutExercises(workoutSessionId).subscribe({
      next: (workoutExercises) => {
        this.workoutExercises = workoutExercises;
        this.workoutExercisesLoaded = true;
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_EXERCISES)
    });
  }

  private updateWorkoutExercise(
    workoutSessionId: number,
    workoutTypeId: number,
    numberOfReps: number
  ): void {
    this.isWidgetUpdating = true;
    this.workoutWidgetService
      .updateWorkoutExercise(workoutSessionId, workoutTypeId, numberOfReps)
      .subscribe({
        next: (addedWorkoutExercise) => {
          this.workoutExercises = [
            ...this.workoutExercises.filter((ex) => ex.workoutTypeId !== workoutTypeId),
            addedWorkoutExercise
          ];
          this.isWidgetUpdating = false;
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_CREATING_WORKOUT_EXERCISE)
      });
  }

  private updateNumberOfReps(workoutTypeId: number, numberOfRepsToAdd: number): void {
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
