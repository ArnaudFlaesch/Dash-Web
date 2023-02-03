import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ChartData, ChartTypeRegistry } from 'chart.js';
import { eachMonthOfInterval, format } from 'date-fns';
import { IWorkoutStatByMonth, IWorkoutType } from '../model/Workout';

@Component({
  selector: 'app-workout-statistics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workout-statistics.component.html',
  styleUrls: ['./workout-statistics.component.scss']
})
export class WorkoutStatisticsComponent implements OnChanges {
  @Input()
  public workoutStatsByYear: IWorkoutStatByMonth[] = [];

  @Input()
  public workoutTypes: IWorkoutType[] = [];

  public workoutStatsChartData: ChartData<keyof ChartTypeRegistry, number[], string> | undefined =
    undefined;

  ngOnChanges(): void {
    const year = new Date(this.workoutStatsByYear[0].monthPeriod).getFullYear();
    const labels = eachMonthOfInterval({
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 1)
    });
    this.workoutStatsChartData = {
      labels: labels.map((date) => format(date, 'MMM')),
      datasets: this.workoutTypes.map((workoutType) => {
        return {
          label: workoutType.name,
          data: this.getRepsListOfWorkoutTypeByYear(workoutType.id)
        };
      })
    };
  }

  private getRepsListOfWorkoutTypeByYear(workoutTypeId: number): number[] {
    return this.workoutStatsByYear.reduce(
      (repListOfYear: number[], workoutStatByMonth: IWorkoutStatByMonth) => {
        if (workoutStatByMonth.workoutTypeId === workoutTypeId) {
          repListOfYear[new Date(workoutStatByMonth.monthPeriod).getMonth()] =
            workoutStatByMonth.totalNumberOfReps;
        }
        return repListOfYear;
      },
      Array(12).fill(0)
    );
  }
}
