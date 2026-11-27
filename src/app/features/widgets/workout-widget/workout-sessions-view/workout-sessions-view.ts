import { Component, input, model, output, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { MatButton } from "@angular/material/button";
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle
} from "@angular/material/datepicker";
import { MatFormField, MatHint, MatLabel, MatSuffix } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { startOfMonth } from "date-fns";
import { DateFormatPipe } from "@shared/dates/date-format-pipe";
import { requiredText } from "@shared/forms/form-validators";
import { WorkoutSession, WorkoutStatsByPeriod, WorkoutType } from "../workout";

@Component({
  selector: "dash-workout-sessions-view",
  templateUrl: "./workout-sessions-view.html",
  styleUrl: "./workout-sessions-view.scss",
  imports: [
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
    DateFormatPipe,
    FormField
  ]
})
export class WorkoutSessionsView {
  protected readonly labels = {
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
    add: "Ajouter"
  };

  public readonly workoutTypes = input.required<WorkoutType[]>();
  public readonly workoutSessions = input.required<WorkoutSession[]>();
  public readonly workoutStatsByWeek = input.required<WorkoutStatsByPeriod[]>();
  public readonly workoutStatsByMonth = input.required<WorkoutStatsByPeriod[]>();
  /** Month whose sessions and statistics are displayed, picked in the month datepicker. */
  public readonly selectedMonth = model<Date>(startOfMonth(new Date()));
  /** Name typed in the form adding a workout type, emptied by the parent once it is added. */
  public readonly workoutName = model<string>("");

  public readonly statisticsRequested = output();
  public readonly workoutSessionSelected = output<WorkoutSession>();
  /** Date picked to create a new workout session. */
  public readonly workoutSessionCreationRequested = output<Date>();
  /** Name of the workout type to add. */
  public readonly workoutTypeAdditionRequested = output<string>();

  public readonly selectedMonthForm = form(this.selectedMonth);
  public readonly workoutNameForm = form(this.workoutName, (path) => requiredText(path));
  private readonly workoutDateInput = signal<string>("");
  public readonly workoutDateForm = form(this.workoutDateInput, (path) => required(path));

  public readonly dateFormat = "DD/MM/YYYY";

  public setMonthAndYear(normalizedMonthAndYear: Date, datepicker: MatDatepicker<Date>): void {
    this.selectedMonth.set(startOfMonth(normalizedMonthAndYear));
    datepicker.close();
  }

  public createWorkoutSession(): void {
    if (this.workoutDateForm().valid()) {
      // The datepicker sets a Date, typed as a string by the form
      this.workoutSessionCreationRequested.emit(new Date(this.workoutDateInput()));
    }
  }

  public addWorkoutType(): void {
    if (this.workoutNameForm().valid()) {
      this.workoutTypeAdditionRequested.emit(this.workoutName());
    }
  }
}
