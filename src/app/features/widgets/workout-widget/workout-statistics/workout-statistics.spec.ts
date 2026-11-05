import { TestBed } from "@angular/core/testing";
import { DateFormatPipe } from "@shared/pipes/date-format-pipe";
import { IWorkoutType } from "../workout.model";
import { WorkoutStatistics } from "./workout-statistics";

describe("WorkoutStatistics", () => {
  let component: WorkoutStatistics;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateFormatPipe]
    }).compileComponents();

    const fixture = TestBed.createComponent(WorkoutStatistics);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("workoutTypes", workoutTypes);
    fixture.componentRef.setInput("workoutStatsByMonth", workoutStatsByMonth);
  });

  const workoutTypes = [{ id: 1, name: "Abdos" } as IWorkoutType];
  const workoutStatsByMonth = [
    {
      totalNumberOfReps: 6,
      workoutTypeId: workoutTypes[0].id,
      monthPeriod: "2022-01-01",
      workoutTypeName: workoutTypes[0].name
    },
    {
      totalNumberOfReps: 4,
      workoutTypeId: workoutTypes[0].id,
      monthPeriod: "2022-02-01",
      workoutTypeName: workoutTypes[0].name
    }
  ];

  it("should create", () => {
    expect(component.workoutStatsChartData()).toEqual({
      datasets: [{ data: [6, 4], label: "Abdos" }],
      labels: ["janv.", "févr."]
    });
  });
});
