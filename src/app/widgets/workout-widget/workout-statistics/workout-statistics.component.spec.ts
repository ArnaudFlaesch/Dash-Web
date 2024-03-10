import { createHostFactory } from '@ngneat/spectator/jest';

import { IWorkoutType } from '../model/Workout';
import { WorkoutStatisticsComponent } from './workout-statistics.component';

describe('WorkoutStatisticsComponent', () => {
  let component: WorkoutStatisticsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule, DateFormatPipe],
      providers: [WorkoutWidgetService, ErrorHandlerService]
    }).compileComponents();

    const fixture = TestBed.createComponent(WorkoutStatisticsComponent);
    component = fixture.componentInstance;
    component.workoutTypes = workoutTypes;
  });

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
    expect(component.workoutStatsByMonth).toEqual(workoutStatsByMonth);
  });
});
