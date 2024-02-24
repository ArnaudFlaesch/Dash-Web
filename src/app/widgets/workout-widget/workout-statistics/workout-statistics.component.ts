import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ChartData, ChartTypeRegistry } from 'chart.js';
import { format, startOfMonth } from 'date-fns';
import { IWorkoutStatByMonth, IWorkoutType } from '../model/Workout';

@Component({
  selector: 'dash-workout-statistics',
  templateUrl: './workout-statistics.component.html',
  styleUrls: ['./workout-statistics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkoutStatisticsComponent implements OnChanges {
  @Input()
  public workoutStatsByMonth: IWorkoutStatByMonth[] = [];

  @Input()
  public workoutTypes: IWorkoutType[] = [];

  public workoutStatsChartData: ChartData<keyof ChartTypeRegistry, number[], string> | undefined =
    undefined;

  ngOnChanges(): void {
    const labels = [
      ...new Set(
        this.workoutStatsByMonth.map((stat) => startOfMonth(new Date(stat.monthPeriod)).getTime())
      )
    ].sort((timeA, timeB) => timeA - timeB);
    this.workoutStatsChartData = {
      labels: labels.map((label) => format(new Date(label), 'MMM')),
      datasets: this.workoutTypes.map((workoutType) => {
        return {
          label: workoutType.name,
          data: this.getRepsListOfWorkoutTypeByMonth(workoutType.id, labels)
        };
      })
    };
  }

  private getRepsListOfWorkoutTypeByMonth(workoutTypeId: number, monthsTimes: number[]): number[] {
    return this.workoutStatsByMonth.reduce(
      (repListOfPeriod: number[], workoutStatByMonth: IWorkoutStatByMonth) => {
        if (workoutStatByMonth.workoutTypeId === workoutTypeId) {
          repListOfPeriod[
            monthsTimes.indexOf(startOfMonth(new Date(workoutStatByMonth.monthPeriod)).getTime())
          ] = workoutStatByMonth.totalNumberOfReps;
        }
        return repListOfPeriod;
      },
      Array(monthsTimes.length).fill(0)
    );
  }
}
