import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { format, startOfMonth } from 'date-fns';

import { ErrorHandlerService } from '../../../app/services/error.handler.service';
import { DEFAULT_DATE_FORMAT } from '../../../app/utils/Constants';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { AuthService } from './../../services/auth.service/auth.service';
import { IWorkoutExercise, IWorkoutSession, IWorkoutType } from './model/Workout';
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
  public workoutNameInput: string | null = null;
  public workoutDateFormControl = new FormControl('');

  public workoutMonths: number[] = [];
  public workoutSessionsByMonth: IWorkoutSession[] = [];

  public isWidgetLoaded = false;
  public currentWorkoutSessionToEdit: IWorkoutSession | undefined;

  public dateFormat = DEFAULT_DATE_FORMAT;

  public widgetViewEnum = WORKOUT_WIDGET_VIEW;

  public WIDGET_VIEW: WORKOUT_WIDGET_VIEW = WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW;

  private selectedMonthTimestamp: number = startOfMonth(new Date()).getTime();

  private ERROR_GETTING_WORKOUT_TYPES =
    "Erreur lors de la récupération de la liste des types d'exercices.";
  private ERROR_GETTING_WORKOUT_SESSIONS =
    "Erreur lors de la récupération de la liste des sessions d'exercices.";
  private ERROR_CREATING_WORKOUT_TYPE = "Erreur lors de la création d'un type d'exercice.";
  private ERROR_CREATING_WORKOUT_SESSION = "Erreur lors de la création d'une session d'exercices.";

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private workoutWidgetService: WorkoutWidgetService,
    public dateUtilsService: DateUtilsService,
    private authService: AuthService
  ) {}

  public refreshWidget(): void {
    const userId = this.authService.getCurrentUserData()?.id;
    if (userId) {
      this.workoutWidgetService.getWorkoutTypes(userId).subscribe({
        next: (workoutTypes) => (this.workoutTypes = workoutTypes),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_WORKOUT_TYPES),
        complete: () => (this.isWidgetLoaded = true)
      });

      this.workoutWidgetService.getWorkoutSessions(userId).subscribe({
        next: (workoutSessions) => {
          this.workoutSessions = workoutSessions;
          this.workoutMonths = this.getWorkoutMonths();
          if (this.workoutSessions.length) {
            this.selectMonth(this.workoutMonths[this.workoutMonths.length - 1]);
          }
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_WORKOUT_SESSIONS)
      });
    }
  }

  public editWorkoutSession(workoutSession: IWorkoutSession): void {
    this.WIDGET_VIEW = WORKOUT_WIDGET_VIEW.EDIT_WORKOUT_SESSION_VIEW;
    this.currentWorkoutSessionToEdit = workoutSession;
  }

  public backToWorkoutSessionsList(): void {
    this.WIDGET_VIEW = WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW;
    this.currentWorkoutSessionToEdit = undefined;
  }

  public addWorkoutType(): void {
    const userId = this.authService.getCurrentUserData()?.id;
    if (this.workoutNameInput && userId) {
      this.workoutWidgetService.addWorkoutType(this.workoutNameInput, userId).subscribe({
        next: (addedWorkoutType) => {
          this.workoutTypes = [...this.workoutTypes, addedWorkoutType];
          this.workoutNameInput = '';
        },
        error: (error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_CREATING_WORKOUT_TYPE)
      });
    }
  }

  public createWorkoutSession(): void {
    const userId = this.authService.getCurrentUserData()?.id;
    if (this.workoutDateFormControl.value && userId) {
      const workoutDate = this.dateUtilsService.formatDateWithOffsetToUtc(
        new Date(Date.parse(this.workoutDateFormControl.value))
      );
      this.workoutWidgetService.createWorkoutSession(workoutDate, userId).subscribe({
        next: (addedWorkoutSession) => {
          this.workoutSessions = [...this.workoutSessions, addedWorkoutSession];
          // Refresh de la liste des entraînements par mois
          // au cas où l'entraînement ajouté aurait eu lieu ce mois ci
          this.workoutMonths = this.getWorkoutMonths();
          this.selectMonth(this.selectedMonthTimestamp);
        },
        error: (error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_CREATING_WORKOUT_SESSION)
      });
    }
  }

  public getWidgetData(): Record<string, string> {
    return <Record<string, string>>{};
  }

  public formatWorkoutDateMonth(workoutDate: number): string {
    return format(workoutDate, 'MMMM');
  }

  public filterWorkoutSessionsByMonth(monthTimestamp: number): void {
    const month = new Date(monthTimestamp);
    this.workoutSessionsByMonth = this.workoutSessions.filter((session) => {
      const workoutSessionDate = new Date(session.workoutDate);
      return (
        workoutSessionDate.getMonth() === month.getMonth() &&
        workoutSessionDate.getFullYear() === month.getFullYear()
      );
    });
  }

  public isSelectedMonth(workoutmonthTimestamp: number): boolean {
    const workoutDate = new Date(workoutmonthTimestamp);
    const selectedMonthDate = new Date(this.selectedMonthTimestamp);
    return (
      workoutDate.getMonth() === selectedMonthDate.getMonth() &&
      workoutDate.getFullYear() === selectedMonthDate.getFullYear()
    );
  }

  public selectMonth(monthTimestamp: number): void {
    this.selectedMonthTimestamp = monthTimestamp;
    this.filterWorkoutSessionsByMonth(monthTimestamp);
  }

  private getWorkoutMonths(): number[] {
    return [
      ...new Set(
        this.workoutSessions
          .map((session) => startOfMonth(new Date(session.workoutDate)).getTime())
          .sort((dateA: number, dateB: number) => dateA - dateB)
      )
    ];
  }
}
