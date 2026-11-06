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
import { MatTooltip } from "@angular/material/tooltip";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { requiredText } from "@shared/forms/form-validators";
import { DateFormatPipe } from "@shared/dates/date-format-pipe";
import { toUtcWallClock } from "@shared/dates/timezone";
import { Widget } from "@widgets/widget/widget";
import {
  WorkoutSession,
  WorkoutStatByMonth,
  WorkoutStatsByPeriod,
  WorkoutType,
  WorkoutStatisticsPeriod,
  WorkoutWidgetView
} from "./workout";
import { WorkoutSessionEdit } from "./workout-session-edit/workout-session-edit";
import { WorkoutStatistics } from "./workout-statistics/workout-statistics";
import { WorkoutWidgetService } from "./workout-widget-service";
import { catchError, Observable, of } from "rxjs";

@Component({
  selector: "dash-workout-widget",
  templateUrl: "./workout-widget.html",
  styleUrl: "./workout-widget.scss",
  imports: [
    Widget,
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
    WorkoutStatistics,
    WorkoutSessionEdit,
    DateFormatPipe,
    FormField,
    MatTooltip
  ]
})
export class WorkoutWidget {
  protected readonly labels = {
    title: "Workout",
    sessions: "Sessions",
    statistics: "Statistiques",
    month: "Mois",
    noSessionThisMonth: "Aucune session ce mois-ci.",
    newSession: "Nouvelle session",
    create: "Créer",
    thisWeek: "Cette semaine",
    thisMonth: "Ce mois-ci",
    workoutTypes: "Types d'exercices",
    noWorkoutType: "Aucun type d'exercice.",
    addWorkoutType: "Ajouter un type d'exercice",
    workoutTypePlaceholder: "Pompes, tractions…",
    add: "Ajouter",
    backToSessions: "Retour aux sessions",
    lastThreeMonths: "3 derniers mois",
    lastSixMonths: "6 derniers mois",
    currentYear: "Cette année",
    lastYear: "Année dernière"
  };
  private readonly ERROR_MESSAGES = {
    gettingWorkoutTypes: "Erreur lors de la récupération de la liste des types d'exercices.",
    gettingWorkoutSessions: "Erreur lors de la récupération de la liste des sessions d'exercices.",
    creatingWorkoutType: "Erreur lors de la création d'un type d'exercice.",
    creatingWorkoutSession: "Erreur lors de la création d'une session d'exercices.",
    gettingWorkoutStats: "Erreur lors de la récupération des statistiques."
  };

  protected readonly currentWorkoutSessionToEdit = signal<WorkoutSession | undefined>(undefined);
  private readonly selectedWorkoutStatistics = signal<WorkoutStatisticsPeriod | undefined>(
    undefined
  );
  protected readonly widgetView = signal(WorkoutWidgetView.WORKOUT_SESSIONS_LIST_VIEW);
  private readonly workoutNameInput = signal<string>("");
  protected readonly workoutNameForm = form(this.workoutNameInput, (path) => requiredText(path));
  private readonly workoutDateInput = signal<string>("");
  protected readonly workoutDateForm = form(this.workoutDateInput, (path) => required(path));
  protected readonly selectedMonthInput = signal<Date>(startOfMonth(new Date()));
  protected readonly selectedMonthForm = form(this.selectedMonthInput);
  // A new object on each refresh, so that the resources reload
  /** Set by the first refresh of the widget, the next ones reload the resources. */
  private readonly refreshRequest = signal<object | undefined>(undefined);

  private readonly workoutTypesResource = rxResource({
    params: () => this.refreshRequest(),
    stream: () =>
      this.handleError(
        this.workoutWidgetService.getWorkoutTypes(),
        this.ERROR_MESSAGES.gettingWorkoutTypes
      ),
    defaultValue: [] as WorkoutType[]
  });

  /** Workout sessions of the selected month. */
  private readonly workoutSessionsResource = rxResource({
    params: () => this.getSelectedMonthParams(),
    stream: ({ params: { selectedMonth } }) =>
      this.handleError(
        this.workoutWidgetService.getWorkoutSessions(
          startOfMonth(selectedMonth),
          endOfMonth(selectedMonth)
        ),
        this.ERROR_MESSAGES.gettingWorkoutSessions
      ),
    defaultValue: [] as WorkoutSession[]
  });

  private readonly workoutStatsByWeekResource = rxResource({
    params: () => this.refreshRequest(),
    stream: () => {
      const today = new Date();
      return this.handleError(
        this.workoutWidgetService.getWorkoutStatsByPeriod(startOfISOWeek(today), endOfWeek(today)),
        this.ERROR_MESSAGES.gettingWorkoutStats
      );
    },
    defaultValue: [] as WorkoutStatsByPeriod[]
  });

  /** Workout statistics of the selected month. */
  private readonly workoutStatsByMonthResource = rxResource({
    params: () => this.getSelectedMonthParams(),
    stream: ({ params: { selectedMonth } }) =>
      this.handleError(
        this.workoutWidgetService.getWorkoutStatsByPeriod(
          startOfMonth(selectedMonth),
          endOfMonth(selectedMonth)
        ),
        this.ERROR_MESSAGES.gettingWorkoutStats
      ),
    defaultValue: [] as WorkoutStatsByPeriod[]
  });

  /** Workout statistics by month over the period selected in the statistics view. */
  private readonly workoutStatsOfMonthsResource = rxResource({
    params: () => {
      const selectedWorkoutStatistics = this.selectedWorkoutStatistics();
      return selectedWorkoutStatistics && this.getStatisticsInterval(selectedWorkoutStatistics);
    },
    stream: ({ params: [dateIntervalStart, dateIntervalEnd] }) =>
      this.handleError(
        this.workoutWidgetService.getWorkoutStatsByMonth(dateIntervalStart, dateIntervalEnd),
        this.ERROR_MESSAGES.gettingWorkoutStats
      ),
    defaultValue: [] as WorkoutStatByMonth[]
  });

  protected readonly workoutTypes = this.workoutTypesResource.value;
  protected readonly workoutSessions = this.workoutSessionsResource.value;
  protected readonly workoutStatsByWeek = this.workoutStatsByWeekResource.value;
  protected readonly workoutStatsByMonth = this.workoutStatsByMonthResource.value;
  protected readonly workoutStatsOfMonths = this.workoutStatsOfMonthsResource.value;
  // Stays loaded while the widget is refreshed
  protected readonly isWidgetLoaded = computed(() =>
    ["resolved", "reloading", "local"].includes(this.workoutTypesResource.status())
  );
  protected readonly isLastYearWorkoutStatisticsSelected = computed(
    () => this.selectedWorkoutStatistics() === WorkoutStatisticsPeriod.LAST_YEAR
  );
  protected readonly isCurrentYearWorkoutStatisticsSelected = computed(
    () => this.selectedWorkoutStatistics() === WorkoutStatisticsPeriod.CURRENT_YEAR
  );
  protected readonly isLastSixMonthsWorkoutStatisticsSelected = computed(
    () => this.selectedWorkoutStatistics() === WorkoutStatisticsPeriod.LAST_SIX_MONTHS
  );
  protected readonly isLastThreeMonthsWorkoutStatisticsSelected = computed(
    () => this.selectedWorkoutStatistics() === WorkoutStatisticsPeriod.LAST_THREE_MONTHS
  );

  protected readonly dateFormat = "DD/MM/YYYY";
  protected readonly WorkoutWidgetView = WorkoutWidgetView;

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly workoutWidgetService = inject(WorkoutWidgetService);

  protected refreshWidget(): void {
    if (!this.refreshRequest()) {
      // First refresh: gives the resources their params, which starts their loading
      this.refreshRequest.set({});
      return;
    }
    // Reloading keeps the current values (status "reloading"), so the widget stays displayed
    this.workoutTypesResource.reload();
    this.workoutSessionsResource.reload();
    this.workoutStatsByWeekResource.reload();
    this.workoutStatsByMonthResource.reload();
  }

  protected editWorkoutSession(workoutSession: WorkoutSession): void {
    this.widgetView.set(WorkoutWidgetView.EDIT_WORKOUT_SESSION_VIEW);
    this.currentWorkoutSessionToEdit.set(workoutSession);
  }

  protected backToWorkoutSessionsList(): void {
    this.widgetView.set(WorkoutWidgetView.WORKOUT_SESSIONS_LIST_VIEW);
    this.currentWorkoutSessionToEdit.set(undefined);
  }

  protected goToStatisticsView(): void {
    this.widgetView.set(WorkoutWidgetView.WORKOUT_STATISTICS_VIEW);
    this.getWorkoutsStatsOfLastThreeMonths();
  }

  protected addWorkoutType(): void {
    const workoutName = this.workoutNameInput();
    if (this.workoutNameForm().valid()) {
      this.workoutWidgetService.addWorkoutType(workoutName).subscribe({
        next: (addedWorkoutType) => {
          this.workoutTypes.update((oldWorkoutTypes) => [...oldWorkoutTypes, addedWorkoutType]);
          this.workoutNameInput.set("");
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.creatingWorkoutType)
      });
    }
  }

  protected createWorkoutSession(): void {
    if (this.workoutDateForm().valid()) {
      // The datepicker sets a Date, typed as a string by the form
      const workoutDate = toUtcWallClock(new Date(this.workoutDateInput()));
      this.workoutWidgetService.createWorkoutSession(workoutDate).subscribe({
        next: (addedWorkoutSession) => {
          this.workoutSessions.update((oldWorkoutSessions) => [
            ...oldWorkoutSessions,
            addedWorkoutSession
          ]);
          this.editWorkoutSession(addedWorkoutSession);
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.creatingWorkoutSession)
      });
    }
  }

  private selectMonth(monthDate: Date): void {
    this.selectedMonthInput.set(monthDate);
  }

  protected setMonthAndYear(normalizedMonthAndYear: Date, datepicker: MatDatepicker<Date>): void {
    this.selectMonth(startOfMonth(normalizedMonthAndYear));
    datepicker.close();
  }

  protected getWorkoutsStatsOfCurrentYear(): void {
    this.selectedWorkoutStatistics.set(WorkoutStatisticsPeriod.CURRENT_YEAR);
  }

  protected getWorkoutsStatsOfLastThreeMonths(): void {
    this.selectedWorkoutStatistics.set(WorkoutStatisticsPeriod.LAST_THREE_MONTHS);
  }

  protected getWorkoutsStatsOfLastSixMonths(): void {
    this.selectedWorkoutStatistics.set(WorkoutStatisticsPeriod.LAST_SIX_MONTHS);
  }

  protected getWorkoutsStatsOfPastYear(): void {
    this.selectedWorkoutStatistics.set(WorkoutStatisticsPeriod.LAST_YEAR);
  }

  private getSelectedMonthParams(): { selectedMonth: Date } | undefined {
    const selectedMonth = this.selectedMonthInput();
    // Nothing is loaded before the first refresh of the widget
    return this.refreshRequest() && isValid(selectedMonth) ? { selectedMonth } : undefined;
  }

  private getStatisticsInterval(workoutStatistics: WorkoutStatisticsPeriod): [Date, Date] {
    const today = new Date();
    switch (workoutStatistics) {
      case WorkoutStatisticsPeriod.LAST_YEAR:
        return [startOfYear(subYears(today, 1)), endOfYear(subYears(today, 1))];
      case WorkoutStatisticsPeriod.CURRENT_YEAR:
        return [startOfYear(today), endOfYear(today)];
      case WorkoutStatisticsPeriod.LAST_SIX_MONTHS:
        return [startOfMonth(subMonths(today, 5)), endOfMonth(today)];
      case WorkoutStatisticsPeriod.LAST_THREE_MONTHS:
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
