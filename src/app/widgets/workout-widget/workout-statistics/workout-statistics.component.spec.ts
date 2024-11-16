import { TestBed } from "@angular/core/testing";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { DateFormatPipe } from "../../../pipes/date-format.pipe";
import { ErrorHandlerService } from "../../../services/error.handler.service";
import { IWorkoutType } from "../model/Workout";
import { WorkoutWidgetService } from "../workout.widget.service";
import { WorkoutStatisticsComponent } from "./workout-statistics.component";

describe("WorkoutStatisticsComponent", () => {
  let component: WorkoutStatisticsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule, DateFormatPipe],
      providers: [WorkoutWidgetService, ErrorHandlerService]
    }).compileComponents();

    const fixture = TestBed.createComponent(WorkoutStatisticsComponent);
    component = fixture.componentInstance;
    component.workoutTypes = workoutTypes;
    component.workoutStatsByMonth = workoutStatsByMonth;
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
    component.ngOnChanges();
    expect(component.workoutStatsChartData).toEqual({
      datasets: [{ data: [6, 4], label: "Abdos" }],
      labels: ["janv.", "févr."]
    });
  });
});
