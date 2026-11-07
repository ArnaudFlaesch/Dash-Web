import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from "ng2-charts";
import { WorkoutType } from "../workout";
import { WorkoutStatistics } from "./workout-statistics";

describe("WorkoutStatistics", () => {
  let chart: BaseChartDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideCharts(withDefaultRegisterables())]
    }).compileComponents();

    const fixture = TestBed.createComponent(WorkoutStatistics);
    fixture.componentRef.setInput("workoutTypes", workoutTypes);
    fixture.componentRef.setInput("workoutStatsByMonth", workoutStatsByMonth);
    await fixture.whenStable();
    chart = fixture.debugElement
      .query(By.css("canvas#workout-statistics"))
      .injector.get(BaseChartDirective);
  });

  const workoutTypes = [{ id: 1, name: "Abdos" } as WorkoutType, { id: 2, name: "Pompes" }];
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
    },
    {
      totalNumberOfReps: 10,
      workoutTypeId: workoutTypes[1].id,
      monthPeriod: "2022-02-01",
      workoutTypeName: workoutTypes[1].name
    }
  ];

  it("Should display a line chart of the reps of each workout type by month", () => {
    expect(chart.type).toEqual("line");
    expect(chart.data).toEqual({
      datasets: [
        { data: [6, 4], label: "Abdos" },
        { data: [0, 10], label: "Pompes" }
      ],
      labels: ["janv.", "févr."]
    });
  });
});
