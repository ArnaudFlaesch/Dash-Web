import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
  subMonths
} from 'date-fns';

import { ErrorHandlerService } from '../../../app/services/error.handler.service';
import { DEFAULT_DATE_FORMAT } from '../../../app/utils/Constants';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import {
  IWorkoutSession,
  IWorkoutStatByMonth,
  IWorkoutStatsByPeriod,
  IWorkoutType
} from './model/Workout';
import { WorkoutWidgetService } from './workout.widget.service';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { WorkoutSessionEditComponent } from './workout-session-edit/workout-session-edit.component';
import { WorkoutStatisticsComponent } from './workout-statistics/workout-statistics.component';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel, MatSuffix, MatHint } from '@angular/material/form-field';
import { MatButton, MatIconButton } from '@angular/material/button';
import { NgSwitch, NgSwitchCase, NgFor, NgIf } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { WidgetComponent } from '../widget/widget.component';

enum WORKOUT_WIDGET_VIEW {
  WORKOUT_SESSIONS_LIST_VIEW = 1,
  WORKOUT_STATISTICS_VIEW = 2,
  EDIT_WORKOUT_SESSION_VIEW = 3
}

enum WORKOUT_STATISTICS {
  LAST_YEAR = 1,
  CURRENT_YEAR = 2,
  LAST_SIX_MONTHS = 3,
  LAST_THREE_MONTHS = 4
}

@Component({
    selector: 'dash-workout-widget',
    templateUrl: './workout-widget.component.html',
    styleUrls: ['./workout-widget.component.scss'],
    standalone: true,
    imports: [WidgetComponent, MatIcon, NgSwitch, NgSwitchCase, MatButton, MatFormField, MatLabel, MatInput, MatDatepickerInput, FormsModule, ReactiveFormsModule, MatDatepickerToggle, MatSuffix, MatDatepicker, NgFor, MatHint, NgIf, MatIconButton, WorkoutStatisticsComponent, WorkoutSessionEditComponent, DateFormatPipe]
})
export class WorkoutWidgetComponent {
  public workoutTypes: IWorkoutType[] = [];
  public workoutSessions: IWorkoutSession[] = [];
  public workoutStatsByWeek: IWorkoutStatsByPeriod[] = [];
  public workoutStatsByMonth: IWorkoutStatsByPeriod[] = [];
  public workoutStatsOfMonths: IWorkoutStatByMonth[] = [];
  public currentWorkoutSessionToEdit: IWorkoutSession | undefined;

  public dateFormat = DEFAULT_DATE_FORMAT;
  public widgetViewEnum = WORKOUT_WIDGET_VIEW;
  public selectedWorkoutStatistics: WORKOUT_STATISTICS | undefined;
  public WIDGET_VIEW: WORKOUT_WIDGET_VIEW = WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW;
  public isWidgetLoaded = false;

  public workoutNameInput: string | null = null;
  public workoutDateFormControl = new FormControl('');
  public selectedMonthFormControl = new FormControl(startOfMonth(new Date()));

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
  ) {}

  public refreshWidget(): void {
    this.workoutWidgetService.getWorkoutTypes().subscribe({
      next: (workoutTypes) => (this.workoutTypes = workoutTypes),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_TYPES),
      complete: () => (this.isWidgetLoaded = true)
    });
    const selectedMonth = this.selectedMonthFormControl.value ?? new Date();
    this.getWorkoutSessionsOfMonth(selectedMonth);
    this.getWorkoutStatsOfCurrentWeek();
    this.getWorkoutStatsOfMonth(selectedMonth);
  }

  public editWorkoutSession(workoutSession: IWorkoutSession): void {
    this.WIDGET_VIEW = WORKOUT_WIDGET_VIEW.EDIT_WORKOUT_SESSION_VIEW;
    this.currentWorkoutSessionToEdit = workoutSession;
  }

  public backToWorkoutSessionsList(): void {
    this.WIDGET_VIEW = WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW;
    this.currentWorkoutSessionToEdit = undefined;
  }

  public goToStatisticsView(): void {
    this.WIDGET_VIEW = WORKOUT_WIDGET_VIEW.WORKOUT_STATISTICS_VIEW;
    this.getWorkoutsStatsOfLastThreeMonths();
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

  public selectMonth(monthDate: Date): void {
    this.selectedMonthFormControl.setValue(monthDate);
    this.getWorkoutSessionsOfMonth(monthDate);
    this.getWorkoutStatsOfMonth(monthDate);
  }

  public setMonthAndYear(normalizedMonthAndYear: Date, datepicker: MatDatepicker<Date>): void {
    this.selectMonth(
      new Date(normalizedMonthAndYear.getFullYear(), normalizedMonthAndYear.getMonth(), 1)
    );
    datepicker.close();
  }

  public getWorkoutsStatsOfCurrentYear(): void {
    if (!this.isCurrentYearWorkoutStatisticsSelected()) {
      this.selectedWorkoutStatistics = WORKOUT_STATISTICS.CURRENT_YEAR;
      this.getWorkoutStatsOfInterval(startOfYear(new Date()), endOfYear(new Date()));
    }
  }

  public getWorkoutsStatsOfLastThreeMonths(): void {
    if (!this.isLastThreeMonthsWorkoutStatisticsSelected()) {
      this.selectedWorkoutStatistics = WORKOUT_STATISTICS.LAST_THREE_MONTHS;
      this.getWorkoutStatsOfLastMonths(2);
    }
  }

  public getWorkoutsStatsOfLastSixMonths(): void {
    if (!this.isLastSixMonthsWorkoutStatisticsSelected()) {
      this.selectedWorkoutStatistics = WORKOUT_STATISTICS.LAST_SIX_MONTHS;
      this.getWorkoutStatsOfLastMonths(5);
    }
  }

  public getWorkoutsStatsOfPastYear(): void {
    if (!this.isLastYearWorkoutStatisticsSelected()) {
      this.selectedWorkoutStatistics = WORKOUT_STATISTICS.LAST_YEAR;
      const today = new Date();
      const lastYear = new Date(today.getFullYear() - 1, 0, 1);
      this.getWorkoutStatsOfInterval(startOfYear(lastYear), endOfYear(lastYear));
    }
  }

  public isLastYearWorkoutStatisticsSelected = (): boolean =>
    this.selectedWorkoutStatistics === WORKOUT_STATISTICS.LAST_YEAR;

  public isCurrentYearWorkoutStatisticsSelected = (): boolean =>
    this.selectedWorkoutStatistics === WORKOUT_STATISTICS.CURRENT_YEAR;

  public isLastSixMonthsWorkoutStatisticsSelected = (): boolean =>
    this.selectedWorkoutStatistics === WORKOUT_STATISTICS.LAST_SIX_MONTHS;

  public isLastThreeMonthsWorkoutStatisticsSelected = (): boolean =>
    this.selectedWorkoutStatistics === WORKOUT_STATISTICS.LAST_THREE_MONTHS;

  private getWorkoutStatsOfLastMonths(numberOfMonthsAgo: number): void {
    const today = new Date();
    const monthsAgo = subMonths(today, numberOfMonthsAgo);
    this.getWorkoutStatsOfInterval(startOfMonth(monthsAgo), endOfMonth(today));
  }

  private getWorkoutStatsOfInterval(dateIntervalStart: Date, dateIntervalEnd: Date): void {
    this.workoutWidgetService.getWorkoutStatsByMonth(dateIntervalStart, dateIntervalEnd).subscribe({
      next: (workoutStatsOfMonths) => (this.workoutStatsOfMonths = workoutStatsOfMonths)
    });
  }

  private getWorkoutSessionsOfMonth(selectedMonth: Date): void {
    this.workoutWidgetService
      .getWorkoutSessions(startOfMonth(selectedMonth), endOfMonth(selectedMonth))
      .subscribe({
        next: (workoutSessions) => (this.workoutSessions = workoutSessions),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_SESSIONS)
      });
  }

  private getWorkoutStatsOfCurrentWeek(): void {
    const today = new Date();
    this.workoutWidgetService
      .getWorkoutStatsByPeriod(startOfISOWeek(today), endOfWeek(today))
      .subscribe({
        next: (workoutStatsByWeek) => (this.workoutStatsByWeek = workoutStatsByWeek),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_STATS)
      });
  }

  private getWorkoutStatsOfMonth(date: Date): void {
    this.workoutWidgetService
      .getWorkoutStatsByPeriod(startOfMonth(date), endOfMonth(date))
      .subscribe({
        next: (workoutStatsByMonth) => {
          this.workoutStatsByMonth = workoutStatsByMonth;
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_STATS)
      });
  }
}
