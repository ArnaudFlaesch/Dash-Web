import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
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
  isValid,
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
import { catchError, Observable, of } from "rxjs";

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
  public readonly currentWorkoutSessionToEdit = signal<IWorkoutSession | undefined>(undefined);
  public readonly selectedWorkoutStatistics = signal<WORKOUT_STATISTICS | undefined>(undefined);
  public readonly widgetView = signal(WORKOUT_WIDGET_VIEW.WORKOUT_SESSIONS_LIST_VIEW);

  public readonly dateFormat = DEFAULT_DATE_FORMAT;
  public readonly widgetViewEnum = WORKOUT_WIDGET_VIEW;

  public readonly workoutNameInput = signal<string>("");
  public readonly workoutNameForm = form(this.workoutNameInput, (path) => requiredText(path));
  public readonly workoutDateInput = signal<string>("");
  public readonly workoutDateForm = form(this.workoutDateInput, (path) => required(path));
  public readonly selectedMonthInput = signal<Date>(startOfMonth(new Date()));
  public readonly selectedMonthForm = form(this.selectedMonthInput);

  public readonly workoutTypesResource = rxResource({
    params: () => this.refreshRequest(),
    stream: () =>
      this.handleError(
        this.workoutWidgetService.getWorkoutTypes(),
        this.ERROR_GETTING_WORKOUT_TYPES
      ),
    defaultValue: [] as IWorkoutType[]
  });

  /** Workout sessions of the selected month. */
  public readonly workoutSessionsResource = rxResource({
    params: () => this.getSelectedMonthParams(),
    stream: ({ params: { selectedMonth } }) =>
      this.handleError(
        this.workoutWidgetService.getWorkoutSessions(
          startOfMonth(selectedMonth),
          endOfMonth(selectedMonth)
        ),
        this.ERROR_GETTING_WORKOUT_SESSIONS
      ),
    defaultValue: [] as IWorkoutSession[]
  });

  public readonly workoutStatsByWeekResource = rxResource({
    params: () => this.refreshRequest(),
    stream: () => {
      const today = new Date();
      return this.handleError(
        this.workoutWidgetService.getWorkoutStatsByPeriod(startOfISOWeek(today), endOfWeek(today)),
        this.ERROR_GETTING_WORKOUT_STATS
      );
    },
    defaultValue: [] as IWorkoutStatsByPeriod[]
  });

  /** Workout statistics of the selected month. */
  public readonly workoutStatsByMonthResource = rxResource({
    params: () => this.getSelectedMonthParams(),
    stream: ({ params: { selectedMonth } }) =>
      this.handleError(
        this.workoutWidgetService.getWorkoutStatsByPeriod(
          startOfMonth(selectedMonth),
          endOfMonth(selectedMonth)
        ),
        this.ERROR_GETTING_WORKOUT_STATS
      ),
    defaultValue: [] as IWorkoutStatsByPeriod[]
  });

  /** Workout statistics by month over the period selected in the statistics view. */
  public readonly workoutStatsOfMonthsResource = rxResource({
    params: () => {
      const selectedWorkoutStatistics = this.selectedWorkoutStatistics();
      return selectedWorkoutStatistics && this.getStatisticsInterval(selectedWorkoutStatistics);
    },
    stream: ({ params: [dateIntervalStart, dateIntervalEnd] }) =>
      this.handleError(
        this.workoutWidgetService.getWorkoutStatsByMonth(dateIntervalStart, dateIntervalEnd),
        this.ERROR_GETTING_WORKOUT_STATS
      ),
    defaultValue: [] as IWorkoutStatByMonth[]
  });

  public readonly workoutTypes = this.workoutTypesResource.value;
  public readonly workoutSessions = this.workoutSessionsResource.value;
  public readonly workoutStatsByWeek = this.workoutStatsByWeekResource.value;
  public readonly workoutStatsByMonth = this.workoutStatsByMonthResource.value;
  public readonly workoutStatsOfMonths = this.workoutStatsOfMonthsResource.value;
  // Stays loaded while the widget is refreshed
  public readonly isWidgetLoaded = computed(() =>
    ["resolved", "reloading", "local"].includes(this.workoutTypesResource.status())
  );

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

  // A new object on each refresh, so that the resources reload
  private readonly refreshRequest = signal<object | undefined>(undefined);

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly workoutWidgetService = inject(WorkoutWidgetService);
  private readonly dateUtilsService = inject(DateUtilsService);

  public refreshWidget(): void {
    this.refreshRequest.set({});
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
  }

  public setMonthAndYear(normalizedMonthAndYear: Date, datepicker: MatDatepicker<Date>): void {
    this.selectMonth(
      new Date(normalizedMonthAndYear.getFullYear(), normalizedMonthAndYear.getMonth(), 1)
    );
    datepicker.close();
  }

  public getWorkoutsStatsOfCurrentYear(): void {
    this.selectedWorkoutStatistics.set(WORKOUT_STATISTICS.CURRENT_YEAR);
  }

  public getWorkoutsStatsOfLastThreeMonths(): void {
    this.selectedWorkoutStatistics.set(WORKOUT_STATISTICS.LAST_THREE_MONTHS);
  }

  public getWorkoutsStatsOfLastSixMonths(): void {
    this.selectedWorkoutStatistics.set(WORKOUT_STATISTICS.LAST_SIX_MONTHS);
  }

  public getWorkoutsStatsOfPastYear(): void {
    this.selectedWorkoutStatistics.set(WORKOUT_STATISTICS.LAST_YEAR);
  }

  private getSelectedMonthParams(): { selectedMonth: Date } | undefined {
    const selectedMonth = this.selectedMonthInput();
    // Read the refresh request so that a new object is returned, and the resources reloaded, on each refresh
    return this.refreshRequest() && isValid(selectedMonth) ? { selectedMonth } : undefined;
  }

  private getStatisticsInterval(workoutStatistics: WORKOUT_STATISTICS): [Date, Date] {
    const today = new Date();
    switch (workoutStatistics) {
      case WORKOUT_STATISTICS.LAST_YEAR:
        return [startOfYear(subYears(today, 1)), endOfYear(subYears(today, 1))];
      case WORKOUT_STATISTICS.CURRENT_YEAR:
        return [startOfYear(today), endOfYear(today)];
      case WORKOUT_STATISTICS.LAST_SIX_MONTHS:
        return [startOfMonth(subMonths(today, 5)), endOfMonth(today)];
      case WORKOUT_STATISTICS.LAST_THREE_MONTHS:
        return [startOfMonth(subMonths(today, 2)), endOfMonth(today)];
    }
  }

  private handleError<T>(request: Observable<T[]>, errorMessage: string): Observable<T[]> {
    return request.pipe(
      catchError((error: HttpErrorResponse) => {
        this.errorHandlerService.handleError(error, errorMessage);
        return of([]);
      })
    );
  }
}
