import { createHostFactory, Spectator } from '@ngneat/spectator/jest';

import { WorkoutStatisticsComponent } from './workout-statistics.component';
import { IWorkoutType } from '../model/Workout';

describe('WorkoutStatisticsComponent', () => {
  const workoutTypes = [{ id: 1, name: 'Abdos' } as IWorkoutType];
  const workoutStatsByMonth = [
    {
      totalNumberOfReps: 6,
      workoutTypeId: workoutTypes[0].id,
      monthPeriod: '2022-01-01',
      workoutTypeName: workoutTypes[0].name
    },
    {
      totalNumberOfReps: 4,
      workoutTypeId: workoutTypes[0].id,
      monthPeriod: '2022-02-01',
      workoutTypeName: workoutTypes[0].name
    }
  ];

  let spectator: Spectator<WorkoutStatisticsComponent>;

  const createHost = createHostFactory({
    component: WorkoutStatisticsComponent
  });

  beforeEach(() => {
    spectator = createHost(
      `<dash-workout-statistics [workoutStatsByMonth]="workoutStatsByMonth" [workoutTypes]="workoutTypes"></dash-workout-statistics>`,
      {
        hostProps: {
          workoutTypes: workoutTypes,
          workoutStatsByMonth: workoutStatsByMonth
        }
      }
    );
  });

  it('should create', () => {
    expect(spectator.component.workoutStatsByMonth).toEqual(workoutStatsByMonth);
  });
});
