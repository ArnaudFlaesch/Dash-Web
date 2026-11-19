import { Component, input, output } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { WorkoutStatByMonth, WorkoutStatisticsPeriod, WorkoutType } from "../workout";
import { WorkoutStatistics } from "../workout-statistics/workout-statistics";

@Component({
  selector: "dash-workout-statistics-view",
  templateUrl: "./workout-statistics-view.html",
  styleUrl: "./workout-statistics-view.scss",
  imports: [MatIconButton, MatIcon, MatTooltip, WorkoutStatistics]
})
export class WorkoutStatisticsView {
  protected readonly labels = {
    statistics: "Statistiques",
    backToSessions: "Retour aux sessions",
    lastThreeMonths: "3 derniers mois",
    lastSixMonths: "6 derniers mois",
    currentYear: "Cette année",
    lastYear: "Année dernière"
  };

  public readonly workoutTypes = input.required<WorkoutType[]>();
  /** Statistics by month over the selected period. */
  public readonly workoutStatsByMonth = input.required<WorkoutStatByMonth[]>();
  public readonly selectedPeriod = input<WorkoutStatisticsPeriod>();

  public readonly periodSelected = output<WorkoutStatisticsPeriod>();
  public readonly backRequested = output();

  /** Selectable periods of the statistics, in their display order. */
  public readonly periods = [
    { value: WorkoutStatisticsPeriod.LAST_THREE_MONTHS, label: this.labels.lastThreeMonths },
    { value: WorkoutStatisticsPeriod.LAST_SIX_MONTHS, label: this.labels.lastSixMonths },
    { value: WorkoutStatisticsPeriod.CURRENT_YEAR, label: this.labels.currentYear },
    { value: WorkoutStatisticsPeriod.LAST_YEAR, label: this.labels.lastYear }
  ];
}
