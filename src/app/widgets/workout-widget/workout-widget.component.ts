import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';

import { ErrorHandlerService } from '../../../app/services/error.handler.service';
import { DEFAULT_DATE_FORMAT } from '../../../app/utils/Constants';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { AuthService } from './../../services/auth.service/auth.service';
import {
  IWorkoutExercise,
  IWorkoutSession,
  IWorkoutType
} from './model/Workout';
import { WorkoutWidgetService } from './workout.widget.service';

enum WORKOUT_WIDGET_VIEW {
  WORKOUT_SESSIONS_LIST_VIEW = 1,
  EDIT_WORKOUT_SESSION_VIEW = 2
}

@Component({
  selector: 'app-workout-widget',
  templateUrl: './workout-widget.component.html',
  styleUrls: ['./workout-widget.component.scss']
})
export class WorkoutWidgetComponent {
  public workouts: IWorkoutExercise[] = [];
  public workoutTypes: IWorkoutType[] = [];
  public workoutSessions: IWorkoutSession[] = [];
  public workoutExercises: IWorkoutExercise[] = [];
  public workoutNameInput: string | null = null;
  public workoutDateFormControl = new FormControl('');

  public isWidgetLoaded = false;

  public dateFormat = DEFAULT_DATE_FORMAT;

  public currentWorkoutSessionToEdit: IWorkoutSession | null = null;

  public widgetViewEnum = WORKOUT_WIDGET_VIEW;

  public WIDGET_VIEW: WORKOUT_WIDGET_VIEW =
    WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW;

  private ERROR_GETTING_WORKOUT_TYPES =
    "Erreur lors de la récupération de la liste des types d'exercices.";
  private ERROR_GETTING_WORKOUT_SESSIONS =
    "Erreur lors de la récupération de la liste des sessions d'exercices.";
  private ERROR_GETTING_WORKOUT_EXERCISES =
    'Erreur lors de la récupération des exercices.';

  private ERROR_CREATING_WORKOUT_TYPE =
    "Erreur lors de la création d'un type d'exercice.";
  private ERROR_CREATING_WORKOUT_EXERCISE =
    "Erreur lors de l'ajout d'un exercice.";

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private workoutWidgetService: WorkoutWidgetService,
    public dateUtilsService: DateUtilsService,
    private authService: AuthService
  ) {}

  public refreshWidget() {
    const userId = this.authService.getCurrentUserData()?.id;
    if (userId) {
      this.workoutWidgetService.getWorkoutTypes(userId).subscribe({
        next: (workoutTypes) => (this.workoutTypes = workoutTypes),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_GETTING_WORKOUT_TYPES
          ),
        complete: () => (this.isWidgetLoaded = true)
      });

      this.workoutWidgetService.getWorkoutSessions(userId).subscribe({
        next: (workoutSessions) => (this.workoutSessions = workoutSessions),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_GETTING_WORKOUT_SESSIONS
          )
      });
    }
  }

  public editWorkoutSession(workoutSession: IWorkoutSession) {
    this.WIDGET_VIEW = WORKOUT_WIDGET_VIEW.EDIT_WORKOUT_SESSION_VIEW;
    this.currentWorkoutSessionToEdit = workoutSession;
    this.fetchWorkoutExercisesBySessionId(this.currentWorkoutSessionToEdit.id);
  }

  public backToWorkoutSessionsList() {
    this.WIDGET_VIEW = WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW;
    this.currentWorkoutSessionToEdit = null;
    this.workoutExercises = [];
  }

  public addWorkoutType() {
    const userId = this.authService.getCurrentUserData()?.id;
    if (this.workoutNameInput && userId) {
      this.workoutWidgetService
        .addWorkoutType(this.workoutNameInput, userId)
        .subscribe({
          next: (addedWorkoutType) => {
            this.workoutTypes = [...this.workoutTypes, addedWorkoutType];
            this.workoutNameInput = '';
          },
          error: (error) =>
            this.errorHandlerService.handleError(
              error.message,
              this.ERROR_CREATING_WORKOUT_TYPE
            )
        });
    }
  }

  public createWorkoutSession() {
    const userId = this.authService.getCurrentUserData()?.id;
    if (this.workoutDateFormControl.value && userId) {
      const workoutDate = this.dateUtilsService.formatDateWithOffsetToUtc(
        new Date(Date.parse(this.workoutDateFormControl.value))
      );
      this.workoutWidgetService
        .createWorkoutSession(workoutDate, userId)
        .subscribe({
          next: (addedWorkoutSession) =>
            (this.workoutSessions = [
              ...this.workoutSessions,
              addedWorkoutSession
            ]),
          error: (error) =>
            this.errorHandlerService.handleError(
              error.message,
              this.ERROR_CREATING_WORKOUT_TYPE
            )
        });
    }
  }

  public fetchWorkoutExercisesBySessionId(workoutSessionId: number) {
    this.workoutWidgetService.getWorkoutExercises(workoutSessionId).subscribe({
      next: (workoutExercises) => (this.workoutExercises = workoutExercises),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(
          error.message,
          this.ERROR_GETTING_WORKOUT_EXERCISES
        )
    });
  }

  public updateWorkoutExercise(
    workoutSessionId: number,
    workoutTypeId: number,
    numberOfReps: number
  ) {
    this.workoutWidgetService
      .updateWorkoutExercise(workoutSessionId, workoutTypeId, numberOfReps)
      .subscribe({
        next: (addedWorkoutExercise) =>
          (this.workoutExercises = [
            ...this.workoutExercises.filter(
              (ex) => ex.workoutExerciseId.workoutTypeId !== workoutTypeId
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

  public getWidgetData = () => <Record<string, string>>{};

  public decrementExerciceNumberOfReps(workoutTypeId: number) {
    this.updateNumberOfReps(workoutTypeId, -1);
  }

  public incrementExerciceNumberOfReps(workoutTypeId: number) {
    this.updateNumberOfReps(workoutTypeId, 1);
  }

  private updateNumberOfReps(workoutTypeId: number, numberOfRepsToAdd: number) {
    const oldNumberOfReps = this.getExerciceNumberOfReps(workoutTypeId);
    if (this.currentWorkoutSessionToEdit) {
      this.updateWorkoutExercise(
        this.currentWorkoutSessionToEdit.id,
        workoutTypeId,
        oldNumberOfReps + numberOfRepsToAdd
      );
    }
  }

  public getExerciceNumberOfReps(workoutTypeId: number): number {
    const workoutType = this.workoutExercises.find(
      (workoutExercise) =>
        workoutExercise.workoutExerciseId.workoutTypeId === workoutTypeId
    );
    if (workoutType) {
      return workoutType.numberOfReps;
    } else return 0;
  }
}
