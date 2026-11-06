import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatTooltip } from "@angular/material/tooltip";
import { DateFormatPipe } from "@shared/dates/date-format-pipe";
import { isResourceLoaded } from "@shared/resources/resource-status";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { WorkoutExercise, WorkoutSession, WorkoutType } from "../workout";
import { WorkoutWidgetService } from "../workout-widget-service";
import { catchError, of } from "rxjs";

@Component({
  selector: "dash-workout-session-edit",
  templateUrl: "./workout-session-edit.html",
  styleUrl: "./workout-session-edit.scss",
  imports: [MatIconButton, MatIcon, MatProgressSpinner, MatTooltip, DateFormatPipe]
})
export class WorkoutSessionEdit {
  protected readonly labels = {
    sessionOf: "Session du",
    finish: "Terminer",
    editReps: "Modifier les répétitions",
    noWorkoutType: "Ajoutez des types d'exercices pour compter vos répétitions."
  };

  private readonly ERROR_MESSAGES = {
    creatingWorkoutExercise: "Erreur lors de l'ajout d'un exercice.",
    gettingWorkoutExercises: "Erreur lors de la récupération des exercices."
  };

  public readonly workoutTypes = input.required<WorkoutType[]>();
  public readonly currentWorkoutSessionToEdit = input.required<WorkoutSession>();

  protected readonly sessionEditMode = signal(false);
  protected readonly isWidgetUpdating = signal(false);

  /** Exercises of the edited session, reloaded whenever the session changes. */
  private readonly workoutExercisesResource = rxResource({
    params: () => this.currentWorkoutSessionToEdit().id || undefined,
    stream: ({ params: workoutSessionId }) =>
      this.workoutWidgetService.getWorkoutExercises(workoutSessionId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingWorkoutExercises);
          return of([]);
        })
      ),
    defaultValue: [] as WorkoutExercise[]
  });

  private readonly workoutExercises = this.workoutExercisesResource.value;
  // Kept short so that the title stays on one line, without surrounding spaces
  protected readonly sessionDate = computed(() => this.currentWorkoutSessionToEdit().workoutDate);
  // "local" once the exercises have been updated in place after a rep change
  protected readonly workoutExercisesLoaded = computed(() =>
    isResourceLoaded(this.workoutExercisesResource.status())
  );

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly workoutWidgetService = inject(WorkoutWidgetService);

  protected decrementExerciseNumberOfReps(workoutTypeId: number): void {
    // The number of reps cannot be negative
    if (this.getExerciseNumberOfReps(workoutTypeId) > 0) {
      this.updateNumberOfReps(workoutTypeId, -1);
    }
  }

  protected incrementExerciseNumberOfReps(workoutTypeId: number): void {
    this.updateNumberOfReps(workoutTypeId, 1);
  }

  protected getExerciseNumberOfReps(workoutTypeId: number): number {
    return (
      this.workoutExercises().find((exercise) => exercise.workoutTypeId === workoutTypeId)
        ?.numberOfReps ?? 0
    );
  }

  protected toggleSessionEditMode(): void {
    this.sessionEditMode.update((sessionEditMode) => !sessionEditMode);
  }

  private updateNumberOfReps(workoutTypeId: number, numberOfRepsToAdd: number): void {
    this.isWidgetUpdating.set(true);
    this.workoutWidgetService
      .updateWorkoutExercise(
        this.currentWorkoutSessionToEdit().id,
        workoutTypeId,
        this.getExerciseNumberOfReps(workoutTypeId) + numberOfRepsToAdd
      )
      .subscribe({
        next: (updatedWorkoutExercise) => {
          this.workoutExercises.update((workoutExercises) => [
            ...workoutExercises.filter((exercise) => exercise.workoutTypeId !== workoutTypeId),
            updatedWorkoutExercise
          ]);
          this.isWidgetUpdating.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isWidgetUpdating.set(false);
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.creatingWorkoutExercise);
        }
      });
  }
}
