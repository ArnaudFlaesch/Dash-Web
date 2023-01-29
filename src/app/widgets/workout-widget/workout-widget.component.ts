import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfISOWeek
} from 'date-fns';

import { ErrorHandlerService } from '../../../app/services/error.handler.service';
import { DEFAULT_DATE_FORMAT } from '../../../app/utils/Constants';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { IWorkoutSession, IWorkoutType, IWorkoutStatsByPeriod } from './model/Workout';
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
  public workoutTypes: IWorkoutType[] = [];
  public workoutSessions: IWorkoutSession[] = [];
  public workoutMonths: Date[];
  public workoutStatsByWeek: IWorkoutStatsByPeriod[] = [];
  public workoutStatsByMonth: IWorkoutStatsByPeriod[] = [];
  public currentWorkoutSessionToEdit: IWorkoutSession | undefined;

  public dateFormat = DEFAULT_DATE_FORMAT;
  public widgetViewEnum = WORKOUT_WIDGET_VIEW;
  public WIDGET_VIEW: WORKOUT_WIDGET_VIEW = WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW;
  public isWidgetLoaded = false;

  public workoutNameInput: string | null = null;
  public workoutDateFormControl = new FormControl('');

  private FIRST_MONTH_OF_WORKOUTS = new Date(2022, 0, 1);
  private selectedMonth: Date = startOfMonth(new Date());

  private ERROR_GETTING_WORKOUT_TYPES =
    "Erreur lors de la récupération de la liste des types d'exercices.";
  private ERROR_GETTING_WORKOUT_SESSIONS =
    "Erreur lors de la récupération de la liste des sessions d'exercices.";
  private ERROR_CREATING_WORKOUT_TYPE = "Erreur lors de la création d'un type d'exercice.";
  private ERROR_CREATING_WORKOUT_SESSION = "Erreur lors de la création d'une session d'exercices.";
  private ERROR_GETTING_WORKOUT_STATS = 'Erreur lors de la récupération des statistiques.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private workoutWidgetService: WorkoutWidgetService,
    public dateUtilsService: DateUtilsService
  ) {
    this.workoutMonths = eachMonthOfInterval({
      start: this.FIRST_MONTH_OF_WORKOUTS,
      end: new Date()
    })
      .map((monthDate) => startOfMonth(new Date(monthDate)))
      .sort((dateA: Date, dateB: Date) => dateA.getTime() - dateB.getTime());
    this.selectedMonth = this.workoutMonths[this.workoutMonths.length - 1];
  }

  public refreshWidget(): void {
    this.workoutWidgetService.getWorkoutTypes().subscribe({
      next: (workoutTypes) => (this.workoutTypes = workoutTypes),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_TYPES),
      complete: () => (this.isWidgetLoaded = true)
    });

    this.getWorkoutSessionsOfMonth(this.selectedMonth);
    this.getWorkoutStatsOfCurrentWeek();
    this.getWorkoutStatsOfMonth();
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
    if (this.workoutNameInput) {
      this.workoutWidgetService.addWorkoutType(this.workoutNameInput).subscribe({
        next: (addedWorkoutType) => {
          this.workoutTypes = [...this.workoutTypes, addedWorkoutType];
          this.workoutNameInput = '';
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_CREATING_WORKOUT_TYPE)
      });
    }
  }

  public createWorkoutSession(): void {
    if (this.workoutDateFormControl.value) {
      const workoutDate = this.dateUtilsService.formatDateWithOffsetToUtc(
        new Date(Date.parse(this.workoutDateFormControl.value))
      );
      this.workoutWidgetService.createWorkoutSession(workoutDate).subscribe({
        next: (addedWorkoutSession) => {
          this.workoutSessions = [...this.workoutSessions, addedWorkoutSession];
          this.editWorkoutSession(addedWorkoutSession);
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_CREATING_WORKOUT_SESSION)
      });
    }
  }

  public getWidgetData(): Record<string, string> {
    return <Record<string, string>>{};
  }

  public formatWorkoutDateMonth(workoutDate: Date): string {
    return format(workoutDate, 'MMMM');
  }

  public isSelectedMonth(workoutMonthDate: Date): boolean {
    const selectedMonthDate = new Date(this.selectedMonth);
    return (
      workoutMonthDate.getMonth() === selectedMonthDate.getMonth() &&
      workoutMonthDate.getFullYear() === selectedMonthDate.getFullYear()
    );
  }

  public selectMonth(monthDate: Date): void {
    this.selectedMonth = monthDate;
    this.getWorkoutSessionsOfMonth(this.selectedMonth);
    this.getWorkoutStatsOfMonth();
  }

  private getWorkoutSessionsOfMonth(selectedMonth: Date): void {
    this.workoutWidgetService
      .getWorkoutSessions(startOfMonth(selectedMonth), endOfMonth(selectedMonth))
      .subscribe({
        next: (workoutSessions) => {
          this.workoutSessions = workoutSessions;
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_SESSIONS)
      });
  }

  private getWorkoutStatsOfCurrentWeek(): void {
    const today = new Date();
    this.workoutWidgetService
      .getWorkoutStatsByPeriod(startOfISOWeek(today), endOfWeek(today))
      .subscribe({
        next: (workoutStatsByWeek) => {
          this.workoutStatsByWeek = workoutStatsByWeek.sort((statA, statB) =>
            statA.workoutTypeName.localeCompare(statB.workoutTypeName)
          );
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_STATS)
      });
  }

  private getWorkoutStatsOfMonth(): void {
    this.workoutWidgetService
      .getWorkoutStatsByPeriod(startOfMonth(this.selectedMonth), endOfMonth(this.selectedMonth))
      .subscribe({
        next: (workoutStatsByMonth) => {
          this.workoutStatsByMonth = workoutStatsByMonth.sort(
            (
              statA,
              statB // FIXME Sort in DB
            ) => statA.workoutTypeName.localeCompare(statB.workoutTypeName)
          );
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_STATS)
      });
  }
}
