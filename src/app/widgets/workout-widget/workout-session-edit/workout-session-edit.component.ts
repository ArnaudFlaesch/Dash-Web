import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, input, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatTooltip } from "@angular/material/tooltip";
import { catchError, of } from "rxjs";
import { DateFormatPipe } from "../../../pipes/date-format.pipe";
import { ErrorHandlerService } from "../../../services/error.handler.service";
import { IWorkoutExercise, IWorkoutSession, IWorkoutType } from "../model/Workout";
import { WorkoutWidgetService } from "../workout.widget.service";

@Component({
  selector: "dash-workout-session-edit",
  templateUrl: "./workout-session-edit.component.html",
  styleUrl: "./workout-session-edit.component.scss",
  imports: [MatIconButton, MatIcon, MatProgressSpinner, MatTooltip, DateFormatPipe]
})
export class WorkoutSessionEditComponent {
  public readonly workoutTypes = input.required<IWorkoutType[]>();
  public readonly currentWorkoutSessionToEdit = input.required<IWorkoutSession>();

  public readonly sessionEditMode = signal(false);
  public readonly isWidgetUpdating = signal(false);

  /** Exercises of the edited session, reloaded whenever the session changes. */
  public readonly workoutExercisesResource = rxResource({
    params: () => this.currentWorkoutSessionToEdit().id || undefined,
    stream: ({ params: workoutSessionId }) =>
      this.workoutWidgetService.getWorkoutExercises(workoutSessionId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_EXERCISES);
          return of([]);
        })
      ),
    defaultValue: [] as IWorkoutExercise[]
  });

  public readonly workoutExercises = this.workoutExercisesResource.value;
  // "local" once the exercises have been updated in place after a rep change
  public readonly workoutExercisesLoaded = computed(() =>
    ["resolved", "local"].includes(this.workoutExercisesResource.status())
  );

  private readonly ERROR_CREATING_WORKOUT_EXERCISE = "Erreur lors de l'ajout d'un exercice.";
  private readonly ERROR_GETTING_WORKOUT_EXERCISES =
    "Erreur lors de la récupération des exercices.";

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly workoutWidgetService = inject(WorkoutWidgetService);

  public decrementExerciceNumberOfReps(workoutTypeId: number): void {
    this.updateNumberOfReps(workoutTypeId, -1);
  }

  public incrementExerciceNumberOfReps(workoutTypeId: number): void {
    this.updateNumberOfReps(workoutTypeId, 1);
  }

  public getExerciceNumberOfReps(workoutTypeId: number): number {
    return (
      this.workoutExercises().find((exercise) => exercise.workoutTypeId === workoutTypeId)
        ?.numberOfReps ?? 0
    );
  }

  public toggleSessionEditMode(): void {
    this.sessionEditMode.update((sessionEditMode) => !sessionEditMode);
  }

  private updateNumberOfReps(workoutTypeId: number, numberOfRepsToAdd: number): void {
    this.isWidgetUpdating.set(true);
    this.workoutWidgetService
      .updateWorkoutExercise(
        this.currentWorkoutSessionToEdit().id,
        workoutTypeId,
        this.getExerciceNumberOfReps(workoutTypeId) + numberOfRepsToAdd
      )
      .subscribe({
        next: (updatedWorkoutExercise) => {
          this.workoutExercises.update((workoutExercises) => [
            ...workoutExercises.filter((exercise) => exercise.workoutTypeId !== workoutTypeId),
            updatedWorkoutExercise
          ]);
          this.isWidgetUpdating.set(false);
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_CREATING_WORKOUT_EXERCISE)
      });
  }
}
