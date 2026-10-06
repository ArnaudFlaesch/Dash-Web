import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { ChartData, ChartTypeRegistry } from "chart.js";
import { format, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { BaseChartDirective } from "ng2-charts";
import { IWorkoutStatByMonth, IWorkoutType } from "../model/Workout";

@Component({
  selector: "dash-workout-statistics",
  templateUrl: "./workout-statistics.component.html",
  styleUrls: ["./workout-statistics.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective]
})
export class WorkoutStatisticsComponent {
  public readonly workoutStatsByMonth = input.required<IWorkoutStatByMonth[]>();
  public readonly workoutTypes = input.required<IWorkoutType[]>();

  public readonly workoutStatsChartData = computed<
    ChartData<keyof ChartTypeRegistry, number[], string> | undefined
  >(() => {
    const stats = this.workoutStatsByMonth();
    const types = this.workoutTypes();
    if (!stats || !types) return undefined;

    const labels = [
      ...new Set(stats.map((stat) => startOfMonth(new Date(stat.monthPeriod)).getTime()))
    ].sort((timeA, timeB) => timeA - timeB);

    return {
      labels: labels.map((label) => format(new Date(label), "MMM", { locale: fr })),
      datasets: types.map((workoutType) => {
        return {
          label: workoutType.name,
          data: this.getRepsListOfWorkoutTypeByMonth(workoutType.id, labels, stats)
        };
      })
    };
  });

  private getRepsListOfWorkoutTypeByMonth(
    workoutTypeId: number,
    monthsTimes: number[],
    stats: IWorkoutStatByMonth[]
  ): number[] {
    return stats.reduce((repListOfPeriod: number[], workoutStatByMonth: IWorkoutStatByMonth) => {
      if (workoutStatByMonth.workoutTypeId === workoutTypeId) {
        repListOfPeriod[
          monthsTimes.indexOf(startOfMonth(new Date(workoutStatByMonth.monthPeriod)).getTime())
        ] = workoutStatByMonth.totalNumberOfReps;
      }
      return repListOfPeriod;
    }, Array(monthsTimes.length).fill(0));
  }
}
