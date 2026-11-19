import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import {
  endOfISOWeek,
  endOfMonth,
  endOfYear,
  isSameMonth,
  isValid,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears
} from "date-fns";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { toUtcWallClock } from "@shared/dates/timezone";
import { isResourceLoaded } from "@shared/resources/resource-status";
import { Widget } from "@widgets/widget/widget";
import {
  WorkoutExercise,
  WorkoutRepsChange,
  WorkoutSession,
  WorkoutStatByMonth,
  WorkoutStatsByPeriod,
  WorkoutType,
  WorkoutStatisticsPeriod,
  WorkoutWidgetView
} from "./workout";
import { WorkoutSessionEdit } from "./workout-session-edit/workout-session-edit";
import { WorkoutSessionsView } from "./workout-sessions-view/workout-sessions-view";
import { WorkoutStatisticsView } from "./workout-statistics-view/workout-statistics-view";
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
    WorkoutSessionsView,
    WorkoutStatisticsView,
    WorkoutSessionEdit
  ]
})
export class WorkoutWidget {
  protected readonly labels = {
    title: "Workout",
    sessions: "Sessions"
  };
  private readonly ERROR_MESSAGES = {
    gettingWorkoutTypes: "Erreur lors de la récupération de la liste des types d'exercices.",
    gettingWorkoutSessions: "Erreur lors de la récupération de la liste des sessions d'exercices.",
    creatingWorkoutType: "Erreur lors de la création d'un type d'exercice.",
    creatingWorkoutSession: "Erreur lors de la création d'une session d'exercices.",
    gettingWorkoutStats: "Erreur lors de la récupération des statistiques.",
    gettingWorkoutExercises: "Erreur lors de la récupération des exercices.",
    creatingWorkoutExercise: "Erreur lors de l'ajout d'un exercice."
  };

  public readonly currentWorkoutSessionToEdit = signal<WorkoutSession | undefined>(undefined);
  public readonly selectedWorkoutStatistics = signal<WorkoutStatisticsPeriod | undefined>(
    undefined
  );
  public readonly widgetView = signal(WorkoutWidgetView.WORKOUT_SESSIONS_LIST_VIEW);
  /** Name typed in the form adding a workout type, emptied once the workout type is added. */
  public readonly workoutName = signal<string>("");
  /** Month whose sessions and statistics are displayed, picked in the sessions view. */
  public readonly selectedMonth = signal<Date>(startOfMonth(new Date()));
  /** Whether an update of the reps of the edited session is being sent. */
  public readonly isUpdatingWorkoutExercise = signal(false);
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
        // From Monday to Sunday
        this.workoutWidgetService.getWorkoutStatsByPeriod(
          startOfISOWeek(today),
          endOfISOWeek(today)
        ),
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

  /** Exercises of the edited session, reloaded whenever the session changes. */
  private readonly workoutExercisesResource = rxResource({
    params: () => {
      const workoutSessionId = this.currentWorkoutSessionToEdit()?.id;
      // Nothing is loaded for a session without id
      return workoutSessionId === 0 ? undefined : workoutSessionId;
    },
    stream: ({ params: workoutSessionId }) =>
      this.handleError(
        this.workoutWidgetService.getWorkoutExercises(workoutSessionId),
        this.ERROR_MESSAGES.gettingWorkoutExercises
      ),
    defaultValue: [] as WorkoutExercise[]
  });

  public readonly workoutTypes = this.workoutTypesResource.value;
  public readonly workoutSessions = this.workoutSessionsResource.value;
  public readonly workoutStatsByWeek = this.workoutStatsByWeekResource.value;
  public readonly workoutStatsByMonth = this.workoutStatsByMonthResource.value;
  public readonly workoutStatsOfMonths = this.workoutStatsOfMonthsResource.value;
  public readonly workoutExercises = this.workoutExercisesResource.value;
  // Stays loaded while the widget is refreshed
  public readonly isWidgetLoaded = computed(() =>
    ["resolved", "reloading", "local"].includes(this.workoutTypesResource.status())
  );
  // "local" once the exercises have been updated in place after a rep change
  public readonly workoutExercisesLoaded = computed(() =>
    isResourceLoaded(this.workoutExercisesResource.status())
  );

  public readonly WorkoutWidgetView = WorkoutWidgetView;

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly workoutWidgetService = inject(WorkoutWidgetService);

  public refreshWidget(): void {
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
    // Only reloaded once a period of the statistics view has been selected
    this.workoutStatsOfMonthsResource.reload();
  }

  public editWorkoutSession(workoutSession: WorkoutSession): void {
    this.widgetView.set(WorkoutWidgetView.EDIT_WORKOUT_SESSION_VIEW);
    this.currentWorkoutSessionToEdit.set(workoutSession);
  }

  public backToWorkoutSessionsList(): void {
    this.widgetView.set(WorkoutWidgetView.WORKOUT_SESSIONS_LIST_VIEW);
    this.currentWorkoutSessionToEdit.set(undefined);
  }

  public goToStatisticsView(): void {
    this.widgetView.set(WorkoutWidgetView.WORKOUT_STATISTICS_VIEW);
    this.selectWorkoutStatistics(WorkoutStatisticsPeriod.LAST_THREE_MONTHS);
  }

  public selectWorkoutStatistics(workoutStatisticsPeriod: WorkoutStatisticsPeriod): void {
    this.selectedWorkoutStatistics.set(workoutStatisticsPeriod);
  }

  public addWorkoutType(workoutName: string): void {
    this.workoutWidgetService.addWorkoutType(workoutName).subscribe({
      next: (addedWorkoutType) => {
        this.workoutTypes.update((oldWorkoutTypes) => [...oldWorkoutTypes, addedWorkoutType]);
        this.workoutName.set("");
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.creatingWorkoutType)
    });
  }

  public createWorkoutSession(pickedDate: Date): void {
    const workoutDate = toUtcWallClock(pickedDate);
    this.workoutWidgetService.createWorkoutSession(workoutDate).subscribe({
      next: (addedWorkoutSession) => {
        // The list only displays the sessions of the selected month
        if (isSameMonth(workoutDate, this.selectedMonth())) {
          this.workoutSessions.update((oldWorkoutSessions) => [
            ...oldWorkoutSessions,
            addedWorkoutSession
          ]);
        }
        this.editWorkoutSession(addedWorkoutSession);
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.creatingWorkoutSession)
    });
  }

  /** Saves the new number of reps of an exercise, then updates it in the edited session. */
  public updateNumberOfReps(
    workoutSessionId: number,
    { workoutTypeId, numberOfReps }: WorkoutRepsChange
  ): void {
    this.isUpdatingWorkoutExercise.set(true);
    this.workoutWidgetService
      .updateWorkoutExercise(workoutSessionId, workoutTypeId, numberOfReps)
      .subscribe({
        next: (updatedWorkoutExercise) => {
          this.workoutExercises.update((workoutExercises) => [
            ...workoutExercises.filter((exercise) => exercise.workoutTypeId !== workoutTypeId),
            updatedWorkoutExercise
          ]);
          this.isUpdatingWorkoutExercise.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isUpdatingWorkoutExercise.set(false);
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.creatingWorkoutExercise);
        }
      });
  }

  private getSelectedMonthParams(): { selectedMonth: Date } | undefined {
    const selectedMonth = this.selectedMonth();
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
