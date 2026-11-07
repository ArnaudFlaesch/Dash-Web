import { Component, computed, input } from "@angular/core";
import { ChartData, ChartTypeRegistry } from "chart.js";
import { format, parseISO, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { BaseChartDirective } from "ng2-charts";
import { WorkoutStatByMonth, WorkoutType } from "../workout";

@Component({
  selector: "dash-workout-statistics",
  templateUrl: "./workout-statistics.html",
  imports: [BaseChartDirective]
})
export class WorkoutStatistics {
  public readonly workoutStatsByMonth = input.required<WorkoutStatByMonth[]>();
  public readonly workoutTypes = input.required<WorkoutType[]>();

  public readonly workoutStatsChartData = computed<
    ChartData<keyof ChartTypeRegistry, number[], string>
  >(() => {
    const stats = this.workoutStatsByMonth();
    const types = this.workoutTypes();

    const labels = [...new Set(stats.map((stat) => this.getMonthTime(stat)))].toSorted(
      (timeA, timeB) => timeA - timeB
    );

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
    stats: WorkoutStatByMonth[]
  ): number[] {
    return stats.reduce((repListOfPeriod: number[], workoutStatByMonth: WorkoutStatByMonth) => {
      if (workoutStatByMonth.workoutTypeId === workoutTypeId) {
        repListOfPeriod[monthsTimes.indexOf(this.getMonthTime(workoutStatByMonth))] =
          workoutStatByMonth.totalNumberOfReps;
      }
      return repListOfPeriod;
    }, new Array<number>(monthsTimes.length).fill(0));
  }

  /**
   * Start of the month of a statistic. Its date ("2022-01-01") is read in the timezone of the
   * browser: `new Date()` would read it in UTC, which is the previous month west of Greenwich.
   */
  private getMonthTime(stat: WorkoutStatByMonth): number {
    return startOfMonth(parseISO(stat.monthPeriod)).getTime();
  }
}
