import { Component, computed, input, output, signal } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatTooltip } from "@angular/material/tooltip";
import { DateFormatPipe } from "@shared/dates/date-format-pipe";
import { WorkoutExercise, WorkoutRepsChange, WorkoutSession, WorkoutType } from "../workout";

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
    removeRep: "Retirer une répétition :",
    addRep: "Ajouter une répétition :",
    noWorkoutType: "Ajoutez des types d'exercices pour compter vos répétitions."
  };

  public readonly workoutTypes = input.required<WorkoutType[]>();
  public readonly workoutSession = input.required<WorkoutSession>();
  public readonly workoutExercises = input.required<WorkoutExercise[]>();
  /** Whether the exercises of the session have been loaded. */
  public readonly isLoaded = input.required<boolean>();
  /** Whether an update of the reps is being sent, which disables the buttons. */
  public readonly isUpdating = input.required<boolean>();

  /** New number of reps of an exercise of the session. */
  public readonly numberOfRepsChanged = output<WorkoutRepsChange>();

  public readonly sessionEditMode = signal(false);

  // Kept short so that the title stays on one line, without surrounding spaces
  public readonly sessionDate = computed(() => this.workoutSession().workoutDate);

  public decrementExerciseNumberOfReps(workoutTypeId: number): void {
    // The number of reps cannot be negative
    if (this.getExerciseNumberOfReps(workoutTypeId) > 0) {
      this.changeNumberOfReps(workoutTypeId, -1);
    }
  }

  public incrementExerciseNumberOfReps(workoutTypeId: number): void {
    this.changeNumberOfReps(workoutTypeId, 1);
  }

  public getExerciseNumberOfReps(workoutTypeId: number): number {
    return (
      this.workoutExercises().find((exercise) => exercise.workoutTypeId === workoutTypeId)
        ?.numberOfReps ?? 0
    );
  }

  public toggleSessionEditMode(): void {
    this.sessionEditMode.update((sessionEditMode) => !sessionEditMode);
  }

  private changeNumberOfReps(workoutTypeId: number, numberOfRepsToAdd: number): void {
    this.numberOfRepsChanged.emit({
      workoutTypeId,
      numberOfReps: this.getExerciseNumberOfReps(workoutTypeId) + numberOfRepsToAdd
    });
  }
}
