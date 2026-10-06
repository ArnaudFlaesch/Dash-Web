import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  WritableSignal
} from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle
} from "@angular/material/datepicker";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
  subMonths
} from "date-fns";

import { MatButton, MatIconButton } from "@angular/material/button";
import { MatFormField, MatHint, MatLabel, MatSuffix } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { DEFAULT_DATE_FORMAT } from "../../utils/Constants";
import { DateFormatPipe } from "../../pipes/date-format.pipe";
import { DateUtilsService } from "../../services/date.utils.service/date.utils.service";
import { WidgetComponent } from "../widget/widget.component";
import {
  IWorkoutSession,
  IWorkoutStatByMonth,
  IWorkoutStatsByPeriod,
  IWorkoutType
} from "./model/Workout";
import { WorkoutSessionEditComponent } from "./workout-session-edit/workout-session-edit.component";
import { WorkoutStatisticsComponent } from "./workout-statistics/workout-statistics.component";
import { WorkoutWidgetService } from "./workout.widget.service";

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
  selector: "dash-workout-widget",
  templateUrl: "./workout-widget.component.html",
  styleUrls: ["./workout-widget.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WidgetComponent,
    MatIcon,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatSuffix,
    MatDatepicker,
    MatHint,
    MatIconButton,
    WorkoutStatisticsComponent,
    WorkoutSessionEditComponent,
    DateFormatPipe,
    FormField
  ]
})
export class WorkoutWidgetComponent {
  public workoutTypes: WritableSignal<IWorkoutType[]> = signal([]);
  public workoutSessions: WritableSignal<IWorkoutSession[]> = signal([]);
  public workoutStatsByWeek: WritableSignal<IWorkoutStatsByPeriod[]> = signal([]);
  public workoutStatsByMonth: WritableSignal<IWorkoutStatsByPeriod[]> = signal([]);
  public workoutStatsOfMonths: WritableSignal<IWorkoutStatByMonth[]> = signal([]);
  public currentWorkoutSessionToEdit = signal<IWorkoutSession | undefined>(undefined);
  public selectedWorkoutStatistics = signal<WORKOUT_STATISTICS | undefined>(undefined);
  public isWidgetLoaded = signal(false);
  public WIDGET_VIEW = signal(WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW);

  public dateFormat = DEFAULT_DATE_FORMAT;
  public widgetViewEnum = WORKOUT_WIDGET_VIEW;

  public workoutNameInput = signal<string>("");
  public readonly workoutNameForm = form(this.workoutNameInput);
  public workoutDateInput = signal<string>("");
  public readonly workoutDateForm = form(this.workoutDateInput);
  public selectedMonthInput = signal<Date>(startOfMonth(new Date()));
  public readonly selectedMonthForm = form(this.selectedMonthInput);

  public readonly isLastYearWorkoutStatisticsSelected = computed(
    () => this.selectedWorkoutStatistics() === WORKOUT_STATISTICS.LAST_YEAR
  );
  public readonly isCurrentYearWorkoutStatisticsSelected = computed(
    () => this.selectedWorkoutStatistics() === WORKOUT_STATISTICS.CURRENT_YEAR
  );
  public readonly isLastSixMonthsWorkoutStatisticsSelected = computed(
    () => this.selectedWorkoutStatistics() === WORKOUT_STATISTICS.LAST_SIX_MONTHS
  );
  public readonly isLastThreeMonthsWorkoutStatisticsSelected = computed(
    () => this.selectedWorkoutStatistics() === WORKOUT_STATISTICS.LAST_THREE_MONTHS
  );

  private readonly ERROR_GETTING_WORKOUT_TYPES =
    "Erreur lors de la récupération de la liste des types d'exercices.";
  private readonly ERROR_GETTING_WORKOUT_SESSIONS =
    "Erreur lors de la récupération de la liste des sessions d'exercices.";
  private readonly ERROR_CREATING_WORKOUT_TYPE = "Erreur lors de la création d'un type d'exercice.";
  private readonly ERROR_CREATING_WORKOUT_SESSION =
    "Erreur lors de la création d'une session d'exercices.";
  private readonly ERROR_GETTING_WORKOUT_STATS = "Erreur lors de la récupération des statistiques.";

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly workoutWidgetService = inject(WorkoutWidgetService);
  private readonly dateUtilsService = inject(DateUtilsService);

  public refreshWidget(): void {
    this.workoutWidgetService.getWorkoutTypes().subscribe({
      next: (workoutTypes) => {
        this.workoutTypes.set(workoutTypes);
        this.isWidgetLoaded.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_TYPES);
        this.isWidgetLoaded.set(true);
      }
    });
    const selectedMonth = this.selectedMonthInput() ?? new Date();
    this.getWorkoutSessionsOfMonth(selectedMonth);
    this.getWorkoutStatsOfCurrentWeek();
    this.getWorkoutStatsOfMonth(selectedMonth);
  }

  public editWorkoutSession(workoutSession: IWorkoutSession): void {
    this.WIDGET_VIEW.set(WORKOUT_WIDGET_VIEW.EDIT_WORKOUT_SESSION_VIEW);
    this.currentWorkoutSessionToEdit.set(workoutSession);
  }

  public backToWorkoutSessionsList(): void {
    this.WIDGET_VIEW.set(WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW);
    this.currentWorkoutSessionToEdit.set(undefined);
  }

  public goToStatisticsView(): void {
    this.WIDGET_VIEW.set(WORKOUT_WIDGET_VIEW.WORKOUT_STATISTICS_VIEW);
    this.getWorkoutsStatsOfLastThreeMonths();
  }

  public addWorkoutType(): void {
    const workoutName = this.workoutNameInput();
    if (workoutName) {
      this.workoutWidgetService.addWorkoutType(workoutName).subscribe({
        next: (addedWorkoutType) => {
          this.workoutTypes.update((oldWorkoutTypes) => [...oldWorkoutTypes, addedWorkoutType]);
          this.workoutNameInput.set("");
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_CREATING_WORKOUT_TYPE)
      });
    }
  }

  public createWorkoutSession(): void {
    const workoutDateVal = this.workoutDateInput();
    if (workoutDateVal) {
      const workoutDate = this.dateUtilsService.formatDateWithOffsetToUtc(
        typeof workoutDateVal === "string"
          ? new Date(Date.parse(workoutDateVal))
          : new Date(workoutDateVal)
      );
      this.workoutWidgetService.createWorkoutSession(workoutDate).subscribe({
        next: (addedWorkoutSession) => {
          this.workoutSessions.update((oldWorkoutSessions) => [
            ...oldWorkoutSessions,
            addedWorkoutSession
          ]);
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
    this.selectedMonthInput.set(monthDate);
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
      this.selectedWorkoutStatistics.set(WORKOUT_STATISTICS.CURRENT_YEAR);
      this.getWorkoutStatsOfInterval(startOfYear(new Date()), endOfYear(new Date()));
    }
  }

  public getWorkoutsStatsOfLastThreeMonths(): void {
    if (!this.isLastThreeMonthsWorkoutStatisticsSelected()) {
      this.selectedWorkoutStatistics.set(WORKOUT_STATISTICS.LAST_THREE_MONTHS);
      this.getWorkoutStatsOfLastMonths(2);
    }
  }

  public getWorkoutsStatsOfLastSixMonths(): void {
    if (!this.isLastSixMonthsWorkoutStatisticsSelected()) {
      this.selectedWorkoutStatistics.set(WORKOUT_STATISTICS.LAST_SIX_MONTHS);
      this.getWorkoutStatsOfLastMonths(5);
    }
  }

  public getWorkoutsStatsOfPastYear(): void {
    if (!this.isLastYearWorkoutStatisticsSelected()) {
      this.selectedWorkoutStatistics.set(WORKOUT_STATISTICS.LAST_YEAR);
      const today = new Date();
      const lastYear = new Date(today.getFullYear() - 1, 0, 1);
      this.getWorkoutStatsOfInterval(startOfYear(lastYear), endOfYear(lastYear));
    }
  }

  private getWorkoutStatsOfLastMonths(numberOfMonthsAgo: number): void {
    const today = new Date();
    const monthsAgo = subMonths(today, numberOfMonthsAgo);
    this.getWorkoutStatsOfInterval(startOfMonth(monthsAgo), endOfMonth(today));
  }

  private getWorkoutStatsOfInterval(dateIntervalStart: Date, dateIntervalEnd: Date): void {
    this.workoutWidgetService.getWorkoutStatsByMonth(dateIntervalStart, dateIntervalEnd).subscribe({
      next: (workoutStatsOfMonths) => this.workoutStatsOfMonths.set(workoutStatsOfMonths)
    });
  }

  private getWorkoutSessionsOfMonth(selectedMonth: Date): void {
    this.workoutWidgetService
      .getWorkoutSessions(startOfMonth(selectedMonth), endOfMonth(selectedMonth))
      .subscribe({
        next: (workoutSessions) => this.workoutSessions.set(workoutSessions),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_SESSIONS)
      });
  }

  private getWorkoutStatsOfCurrentWeek(): void {
    const today = new Date();
    this.workoutWidgetService
      .getWorkoutStatsByPeriod(startOfISOWeek(today), endOfWeek(today))
      .subscribe({
        next: (workoutStatsByWeek) => this.workoutStatsByWeek.set(workoutStatsByWeek),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_STATS)
      });
  }

  private getWorkoutStatsOfMonth(date: Date): void {
    this.workoutWidgetService
      .getWorkoutStatsByPeriod(startOfMonth(date), endOfMonth(date))
      .subscribe({
        next: (workoutStatsByMonth) => {
          this.workoutStatsByMonth.set(workoutStatsByMonth);
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_STATS)
      });
  }
}
