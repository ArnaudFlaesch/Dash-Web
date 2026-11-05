import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { environment } from "../../../../environments/environment";
import { ErrorHandlerService } from "../../../services/error-handler.service";
import { IWorkoutExercise, IWorkoutSession, IWorkoutType } from "../model/Workout";
import { WorkoutWidgetService } from "../workout-widget.service";
import { WorkoutSessionEditComponent } from "./workout-session-edit.component";
import { provideHttpClient } from "@angular/common/http";
import { vi } from "vitest";

describe("WorkoutSessionEditComponent", () => {
  let component: WorkoutSessionEditComponent;
  let fixture: ComponentFixture<WorkoutSessionEditComponent>;
  let httpTestingController: HttpTestingController;

  const workoutTypes = [{ id: 1, name: "Abdos" } as IWorkoutType];
  const newWorkoutSessionDate = new Date(2022, 8, 1, 0, 0, 0).toString();
  const currentWorkoutSessionToEdit = {
    id: 1,
    workoutDate: newWorkoutSessionDate
  } as IWorkoutSession;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        WorkoutWidgetService,
        provideHttpClient(),
        provideHttpClientTesting(),
        ErrorHandlerService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutSessionEditComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("workoutTypes", workoutTypes);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should add a rep to an exercise", () => {
    fixture.componentRef.setInput("currentWorkoutSessionToEdit", currentWorkoutSessionToEdit);
    TestBed.tick();
    const getWorkoutExercisesRequest = httpTestingController.expectOne(
      environment.backend_url +
        `/workoutWidget/workoutExercises?workoutSessionId=${currentWorkoutSessionToEdit.id}`
    );
    getWorkoutExercisesRequest.flush([]);
    const workoutTypeIdToEdit = workoutTypes[0].id;
    expect(component.workoutExercises()).toEqual([]);

    expect(component.getExerciceNumberOfReps(workoutTypeIdToEdit)).toEqual(0);
    component.incrementExerciceNumberOfReps(workoutTypeIdToEdit);
    const incrementWorkoutExerciseRequest = httpTestingController.expectOne(
      environment.backend_url + `/workoutWidget/updateWorkoutExercise`
    );
    incrementWorkoutExerciseRequest.flush({
      workoutSessionId: currentWorkoutSessionToEdit.id,
      workoutTypeId: workoutTypeIdToEdit,
      numberOfReps: 1
    } as IWorkoutExercise);

    expect(component.getExerciceNumberOfReps(workoutTypeIdToEdit)).toEqual(1);

    component.decrementExerciceNumberOfReps(workoutTypeIdToEdit);
    const decrementWorkoutExerciseRequest = httpTestingController.expectOne(
      environment.backend_url + `/workoutWidget/updateWorkoutExercise`
    );
    decrementWorkoutExerciseRequest.flush({
      workoutSessionId: currentWorkoutSessionToEdit.id,
      workoutTypeId: workoutTypeIdToEdit,
      numberOfReps: 0
    } as IWorkoutExercise);

    expect(component.getExerciceNumberOfReps(workoutTypeIdToEdit)).toEqual(0);
  });

  const workoutExercisesUrl =
    environment.backend_url +
    `/workoutWidget/workoutExercises?workoutSessionId=${currentWorkoutSessionToEdit.id}`;
  const updateWorkoutExerciseUrl = environment.backend_url + "/workoutWidget/updateWorkoutExercise";

  /** Displays the edited session, with the given exercises. */
  async function displaySession(workoutExercises: IWorkoutExercise[]): Promise<HTMLElement> {
    fixture.componentRef.setInput("currentWorkoutSessionToEdit", currentWorkoutSessionToEdit);
    TestBed.tick();
    httpTestingController.expectOne(workoutExercisesUrl).flush(workoutExercises);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it("should display a spinner until the exercises are loaded", async () => {
    fixture.componentRef.setInput("currentWorkoutSessionToEdit", currentWorkoutSessionToEdit);
    TestBed.tick();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector("mat-spinner")).not.toBeNull();
    expect(element.querySelector("#workout-session-date")).toBeNull();

    httpTestingController.expectOne(workoutExercisesUrl).flush([]);
    await fixture.whenStable();

    expect(element.querySelector("mat-spinner")).toBeNull();
    // Exact text, without surrounding spaces, as checked by the end-to-end tests
    expect(element.querySelector("#workout-session-date")?.textContent).toEqual(
      `${component.labels.sessionOf} ${new Date(currentWorkoutSessionToEdit.workoutDate).toLocaleDateString("fr")}`
    );
  });

  it("should display the workout types with their number of reps", async () => {
    fixture.componentRef.setInput("workoutTypes", [
      ...workoutTypes,
      { id: 2, name: "Pompes" } as IWorkoutType
    ]);
    const element = await displaySession([{ workoutTypeId: 1, numberOfReps: 12 }]);

    const exercises = element.querySelectorAll(".workout-exercise-container");
    expect(exercises).toHaveLength(2);
    expect(exercises[0].querySelector(".workout-type-name")?.textContent).toContain("Abdos");
    expect(exercises[0].querySelector(".workout-number-of-reps")?.textContent).toContain("12");
    expect(exercises[1].querySelector(".workout-type-name")?.textContent).toContain("Pompes");
    expect(exercises[1].querySelector(".workout-number-of-reps")).toBeNull();
    expect(exercises[1].querySelector(".workout-no-reps")?.textContent).toContain("0");
    // The reps can only be edited in the edit mode
    expect(element.querySelector(".add-rep-to-workout-button")).toBeNull();
    expect(element.querySelector(".substract-rep-to-workout-button")).toBeNull();
  });

  it("should display a message without workout type", async () => {
    fixture.componentRef.setInput("workoutTypes", []);
    const element = await displaySession([]);

    expect(element.querySelector(".workout-no-exercise")?.textContent).toContain(
      component.labels.noWorkoutType
    );
    expect(element.querySelector(".workout-exercise-container")).toBeNull();
  });

  it("should switch between the read and the edit modes", async () => {
    const element = await displaySession([]);
    expect(element.querySelector("#validate-session-button")).toBeNull();

    (element.querySelector("#edit-session-button") as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(component.sessionEditMode()).toBe(true);
    expect(element.querySelector("#edit-session-button")).toBeNull();
    expect(element.querySelector(".workout-exercise-container")?.classList).toContain("edit-mode");
    expect(element.querySelector(".add-rep-to-workout-button")).not.toBeNull();
    expect(element.querySelector(".substract-rep-to-workout-button")).not.toBeNull();

    (element.querySelector("#validate-session-button") as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(component.sessionEditMode()).toBe(false);
    expect(element.querySelector("#edit-session-button")).not.toBeNull();
    expect(element.querySelector(".add-rep-to-workout-button")).toBeNull();
  });

  it("should update the reps with the buttons, disabled while the update is sent", async () => {
    const element = await displaySession([{ workoutTypeId: 1, numberOfReps: 3 }]);
    component.toggleSessionEditMode();
    await fixture.whenStable();
    const addButton = element.querySelector(".add-rep-to-workout-button") as HTMLButtonElement;
    const substractButton = element.querySelector(
      ".substract-rep-to-workout-button"
    ) as HTMLButtonElement;

    addButton.click();
    TestBed.tick();
    const addRequest = httpTestingController.expectOne(updateWorkoutExerciseUrl);
    expect(addRequest.request.body).toEqual({
      workoutSessionId: currentWorkoutSessionToEdit.id,
      workoutTypeId: 1,
      numberOfReps: 4
    });
    expect(addButton.disabled).toBe(true);
    expect(substractButton.disabled).toBe(true);
    addRequest.flush({ workoutTypeId: 1, numberOfReps: 4 });
    await fixture.whenStable();
    expect(addButton.disabled).toBe(false);
    expect(element.querySelector(".workout-number-of-reps")?.textContent).toContain("4");

    substractButton.click();
    const substractRequest = httpTestingController.expectOne(updateWorkoutExerciseUrl);
    expect(substractRequest.request.body.numberOfReps).toEqual(3);
    substractRequest.flush({ workoutTypeId: 1, numberOfReps: 3 });
    await fixture.whenStable();
    expect(element.querySelector(".workout-number-of-reps")?.textContent).toContain("3");
  });

  it("should enable the buttons again when the update of the reps fails", async () => {
    const errorHandlerService = TestBed.inject(ErrorHandlerService);
    const handleErrorSpy = vi
      .spyOn(errorHandlerService, "handleError")
      .mockImplementation(() => undefined);
    const element = await displaySession([{ workoutTypeId: 1, numberOfReps: 3 }]);
    component.toggleSessionEditMode();
    await fixture.whenStable();
    const addButton = element.querySelector(".add-rep-to-workout-button") as HTMLButtonElement;

    addButton.click();
    httpTestingController
      .expectOne(updateWorkoutExerciseUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await fixture.whenStable();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de l'ajout d'un exercice."
    );
    expect(component.isWidgetUpdating()).toBe(false);
    expect(addButton.disabled).toBe(false);
    // The number of reps is unchanged
    expect(component.getExerciceNumberOfReps(1)).toEqual(3);
  });

  it("should not remove a rep from an exercise without reps", async () => {
    await displaySession([]);

    component.decrementExerciceNumberOfReps(workoutTypes[0].id);

    httpTestingController.expectNone(updateWorkoutExerciseUrl);
    expect(component.getExerciceNumberOfReps(workoutTypes[0].id)).toEqual(0);
  });

  it("should handle the error when getting the exercises", async () => {
    const errorHandlerService = TestBed.inject(ErrorHandlerService);
    const handleErrorSpy = vi
      .spyOn(errorHandlerService, "handleError")
      .mockImplementation(() => undefined);
    fixture.componentRef.setInput("currentWorkoutSessionToEdit", currentWorkoutSessionToEdit);
    TestBed.tick();
    httpTestingController
      .expectOne(workoutExercisesUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await fixture.whenStable();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des exercices."
    );
    expect(component.workoutExercises()).toEqual([]);
    expect(component.workoutExercisesLoaded()).toBe(true);
  });

  it("should not load the exercises of a session without id", () => {
    fixture.componentRef.setInput("currentWorkoutSessionToEdit", {
      ...currentWorkoutSessionToEdit,
      id: 0
    });
    TestBed.tick();

    httpTestingController.expectNone(environment.backend_url + "/workoutWidget/workoutExercises");
    expect(component.workoutExercises()).toEqual([]);
  });
});
