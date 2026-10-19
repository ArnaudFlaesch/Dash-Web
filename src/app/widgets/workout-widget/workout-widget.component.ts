import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
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
  subMonths,
  subYears
} from "date-fns";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatFormField, MatHint, MatLabel, MatSuffix } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { DEFAULT_DATE_FORMAT } from "../../utils/Constants";
import { requiredText } from "../../utils/form-validators";
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
  styleUrl: "./workout-widget.component.scss",
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
  public readonly workoutTypes = signal<IWorkoutType[]>([]);
  public readonly workoutSessions = signal<IWorkoutSession[]>([]);
  public readonly workoutStatsByWeek = signal<IWorkoutStatsByPeriod[]>([]);
  public readonly workoutStatsByMonth = signal<IWorkoutStatsByPeriod[]>([]);
  public readonly workoutStatsOfMonths = signal<IWorkoutStatByMonth[]>([]);
  public readonly currentWorkoutSessionToEdit = signal<IWorkoutSession | undefined>(undefined);
  public readonly selectedWorkoutStatistics = signal<WORKOUT_STATISTICS | undefined>(undefined);
  public readonly isWidgetLoaded = signal(false);
  public readonly widgetView = signal(WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW);

  public readonly dateFormat = DEFAULT_DATE_FORMAT;
  public readonly widgetViewEnum = WORKOUT_WIDGET_VIEW;

  public readonly workoutNameInput = signal<string>("");
  public readonly workoutNameForm = form(this.workoutNameInput, (path) => requiredText(path));
  public readonly workoutDateInput = signal<string>("");
  public readonly workoutDateForm = form(this.workoutDateInput, (path) => required(path));
  public readonly selectedMonthInput = signal<Date>(startOfMonth(new Date()));
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
    this.selectMonth(this.selectedMonthInput());
    this.getWorkoutStatsOfCurrentWeek();
  }

  public editWorkoutSession(workoutSession: IWorkoutSession): void {
    this.widgetView.set(WORKOUT_WIDGET_VIEW.EDIT_WORKOUT_SESSION_VIEW);
    this.currentWorkoutSessionToEdit.set(workoutSession);
  }

  public backToWorkoutSessionsList(): void {
    this.widgetView.set(WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW);
    this.currentWorkoutSessionToEdit.set(undefined);
  }

  public goToStatisticsView(): void {
    this.widgetView.set(WORKOUT_WIDGET_VIEW.WORKOUT_STATISTICS_VIEW);
    this.getWorkoutsStatsOfLastThreeMonths();
  }

  public addWorkoutType(): void {
    const workoutName = this.workoutNameInput();
    if (this.workoutNameForm().valid()) {
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
    if (this.workoutDateForm().valid()) {
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

  public getWidgetData(): Record<string, never> {
    return {};
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
    const today = new Date();
    this.selectWorkoutStatistics(
      WORKOUT_STATISTICS.CURRENT_YEAR,
      startOfYear(today),
      endOfYear(today)
    );
  }

  public getWorkoutsStatsOfLastThreeMonths(): void {
    this.selectWorkoutStatistics(
      WORKOUT_STATISTICS.LAST_THREE_MONTHS,
      startOfMonth(subMonths(new Date(), 2)),
      endOfMonth(new Date())
    );
  }

  public getWorkoutsStatsOfLastSixMonths(): void {
    this.selectWorkoutStatistics(
      WORKOUT_STATISTICS.LAST_SIX_MONTHS,
      startOfMonth(subMonths(new Date(), 5)),
      endOfMonth(new Date())
    );
  }

  public getWorkoutsStatsOfPastYear(): void {
    const lastYear = subYears(new Date(), 1);
    this.selectWorkoutStatistics(
      WORKOUT_STATISTICS.LAST_YEAR,
      startOfYear(lastYear),
      endOfYear(lastYear)
    );
  }

  private selectWorkoutStatistics(
    workoutStatistics: WORKOUT_STATISTICS,
    dateIntervalStart: Date,
    dateIntervalEnd: Date
  ): void {
    if (this.selectedWorkoutStatistics() !== workoutStatistics) {
      this.selectedWorkoutStatistics.set(workoutStatistics);
      this.getWorkoutStatsOfInterval(dateIntervalStart, dateIntervalEnd);
    }
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
        next: (workoutStatsByMonth) => this.workoutStatsByMonth.set(workoutStatsByMonth),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_STATS)
      });
  }
}
