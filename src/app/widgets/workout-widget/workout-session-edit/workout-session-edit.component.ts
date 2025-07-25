import { IWorkoutExercise, IWorkoutSession, IWorkoutType } from "./../model/Workout";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  SimpleChanges,
  WritableSignal
} from "@angular/core";
import { ErrorHandlerService } from "../../../services/error.handler.service";
import { WorkoutWidgetService } from "../workout.widget.service";
import { HttpErrorResponse } from "@angular/common/http";
import { DateFormatPipe } from "../../../pipes/date-format.pipe";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatIcon } from "@angular/material/icon";
import { MatIconButton } from "@angular/material/button";
import { NgClass } from "@angular/common";

@Component({
  selector: "dash-workout-session-edit",
  templateUrl: "./workout-session-edit.component.html",
  styleUrls: ["./workout-session-edit.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatIconButton, MatIcon, NgClass, MatProgressSpinner, DateFormatPipe]
})
export class WorkoutSessionEditComponent {
  public readonly workoutTypes = input.required<IWorkoutType[]>();
  public readonly currentWorkoutSessionToEdit = input.required<IWorkoutSession>();

  public workoutExercises: WritableSignal<IWorkoutExercise[]> = signal([]);

  public sessionEditMode = signal(false);
  public isWidgetUpdating = signal(false);
  public workoutExercisesLoaded = signal(false);

  private readonly ERROR_CREATING_WORKOUT_EXERCISE = "Erreur lors de l'ajout d'un exercice.";
  private readonly ERROR_GETTING_WORKOUT_EXERCISES =
    "Erreur lors de la récupération des exercices.";

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly workoutWidgetService = inject(WorkoutWidgetService);

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes["currentWorkoutSessionToEdit"].currentValue)
      this.fetchWorkoutExercisesBySessionId(changes["currentWorkoutSessionToEdit"].currentValue.id);
  }

  public decrementExerciceNumberOfReps(workoutTypeId: number): void {
    this.updateNumberOfReps(workoutTypeId, -1);
  }

  public incrementExerciceNumberOfReps(workoutTypeId: number): void {
    this.updateNumberOfReps(workoutTypeId, 1);
  }

  public getExerciceNumberOfReps(workoutTypeId: number): number {
    const workoutType = this.workoutExercises().find(
      (workoutExercise) => workoutExercise.workoutTypeId === workoutTypeId
    );
    return workoutType ? workoutType.numberOfReps : 0;
  }

  public toggleSessionEditMode(): void {
    this.sessionEditMode.set(!this.sessionEditMode());
  }

  private fetchWorkoutExercisesBySessionId(workoutSessionId: number): void {
    this.workoutExercisesLoaded.set(false);
    this.workoutWidgetService.getWorkoutExercises(workoutSessionId).subscribe({
      next: (workoutExercises) => {
        this.workoutExercises.set(workoutExercises);
        this.workoutExercisesLoaded.set(true);
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_WORKOUT_EXERCISES)
    });
  }

  private updateWorkoutExercise(
    workoutSessionId: number,
    workoutTypeId: number,
    numberOfReps: number
  ): void {
    this.isWidgetUpdating.set(true);
    this.workoutWidgetService
      .updateWorkoutExercise(workoutSessionId, workoutTypeId, numberOfReps)
      .subscribe({
        next: (addedWorkoutExercise) => {
          this.workoutExercises.update((oldWorkoutExercises) => [
            ...oldWorkoutExercises.filter((ex) => ex.workoutTypeId !== workoutTypeId),
            addedWorkoutExercise
          ]);
          this.isWidgetUpdating.set(false);
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_CREATING_WORKOUT_EXERCISE)
      });
  }

  private updateNumberOfReps(workoutTypeId: number, numberOfRepsToAdd: number): void {
    const oldNumberOfReps = this.getExerciceNumberOfReps(workoutTypeId);
    const currentWorkoutSessionToEdit = this.currentWorkoutSessionToEdit();
    if (currentWorkoutSessionToEdit) {
      this.updateWorkoutExercise(
        this.currentWorkoutSessionToEdit().id,
        workoutTypeId,
        oldNumberOfReps + numberOfRepsToAdd
      );
    }
  }
}
