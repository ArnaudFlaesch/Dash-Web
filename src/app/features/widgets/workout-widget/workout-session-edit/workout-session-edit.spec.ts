import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { WorkoutExercise, WorkoutSession, WorkoutType } from "../workout";
import { WorkoutSessionEdit } from "./workout-session-edit";
import { provideHttpClient } from "@angular/common/http";
import { vi } from "vitest";

describe("WorkoutSessionEdit", () => {
  let fixture: ComponentFixture<WorkoutSessionEdit>;
  let httpTestingController: HttpTestingController;

  const workoutTypes = [{ id: 1, name: "Abdos" } as WorkoutType];
  const newWorkoutSessionDate = new Date(2022, 8, 1, 0, 0, 0).toString();
  const currentWorkoutSessionToEdit = {
    id: 1,
    workoutDate: newWorkoutSessionDate
  } as WorkoutSession;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutSessionEdit);
    fixture.componentRef.setInput("workoutTypes", workoutTypes);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  const workoutExercisesUrl = `${environment.backend_url}/workout/sessions/${currentWorkoutSessionToEdit.id}/exercises`;
  const updateWorkoutExerciseUrl = `${workoutExercisesUrl}/${workoutTypes[0].id}`;

  /** Displays the edited session, with the given exercises. */
  async function displaySession(workoutExercises: WorkoutExercise[]): Promise<HTMLElement> {
    fixture.componentRef.setInput("currentWorkoutSessionToEdit", currentWorkoutSessionToEdit);
    TestBed.tick();
    httpTestingController.expectOne(workoutExercisesUrl).flush(workoutExercises);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  async function toEditMode(element: HTMLElement): Promise<void> {
    element.querySelector<HTMLButtonElement>("#edit-session-button")?.click();
    await fixture.whenStable();
  }

  function getDisplayedReps(element: HTMLElement): string | undefined {
    return element
      .querySelector(".workout-exercise-container .edit-reps-container > span")
      ?.textContent?.trim();
  }

  it("should add a rep to an exercise without reps, then remove it", async () => {
    const element = await displaySession([]);
    expect(getDisplayedReps(element)).toEqual("0");
    await toEditMode(element);

    element.querySelector<HTMLButtonElement>(".add-rep-to-workout-button")?.click();
    const incrementRequest = httpTestingController.expectOne(updateWorkoutExerciseUrl);
    expect(incrementRequest.request.method).toEqual("PUT");
    expect(incrementRequest.request.body).toEqual({ numberOfReps: 1 });
    incrementRequest.flush({ workoutTypeId: workoutTypes[0].id, numberOfReps: 1 });
    await fixture.whenStable();
    expect(element.querySelector(".workout-number-of-reps")?.textContent).toContain("1");

    element.querySelector<HTMLButtonElement>(".subtract-rep-to-workout-button")?.click();
    const decrementRequest = httpTestingController.expectOne(updateWorkoutExerciseUrl);
    expect(decrementRequest.request.body.numberOfReps).toEqual(0);
    decrementRequest.flush({ workoutTypeId: workoutTypes[0].id, numberOfReps: 0 });
    await fixture.whenStable();
    expect(element.querySelector(".workout-number-of-reps")).toBeNull();
    expect(getDisplayedReps(element)).toEqual("0");
  });

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
      `Session du ${new Date(currentWorkoutSessionToEdit.workoutDate).toLocaleDateString("fr")}`
    );
  });

  it("should display the workout types with their number of reps", async () => {
    fixture.componentRef.setInput("workoutTypes", [
      ...workoutTypes,
      { id: 2, name: "Pompes" } as WorkoutType
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
    expect(element.querySelector(".subtract-rep-to-workout-button")).toBeNull();
  });

  it("should display a message without workout type", async () => {
    fixture.componentRef.setInput("workoutTypes", []);
    const element = await displaySession([]);

    expect(element.querySelector(".workout-no-exercise")?.textContent).toContain(
      "Ajoutez des types d'exercices pour compter vos répétitions."
    );
    expect(element.querySelector(".workout-exercise-container")).toBeNull();
  });

  it("should switch between the read and the edit modes", async () => {
    const element = await displaySession([]);
    expect(element.querySelector("#validate-session-button")).toBeNull();
    expect(element.querySelector("#edit-session-button")?.getAttribute("aria-label")).toEqual(
      "Modifier les répétitions"
    );

    element.querySelector<HTMLButtonElement>("#edit-session-button")!.click();
    await fixture.whenStable();
    expect(element.querySelector("#edit-session-button")).toBeNull();
    expect(element.querySelector(".workout-exercise-container")?.classList).toContain("edit-mode");
    // The icon buttons are labelled for the screen readers
    expect(element.querySelector("#validate-session-button")?.getAttribute("aria-label")).toEqual(
      "Terminer"
    );
    expect(element.querySelector(".add-rep-to-workout-button")?.getAttribute("aria-label")).toEqual(
      "Ajouter une répétition : Abdos"
    );
    expect(
      element.querySelector(".subtract-rep-to-workout-button")?.getAttribute("aria-label")
    ).toEqual("Retirer une répétition : Abdos");

    element.querySelector<HTMLButtonElement>("#validate-session-button")!.click();
    await fixture.whenStable();
    expect(element.querySelector("#edit-session-button")).not.toBeNull();
    expect(element.querySelector(".add-rep-to-workout-button")).toBeNull();
  });

  it("should update the reps with the buttons, disabled while the update is sent", async () => {
    const element = await displaySession([{ workoutTypeId: 1, numberOfReps: 3 }]);
    await toEditMode(element);
    const addButton = element.querySelector<HTMLButtonElement>(".add-rep-to-workout-button")!;
    const subtractButton = element.querySelector<HTMLButtonElement>(
      ".subtract-rep-to-workout-button"
    )!;

    addButton.click();
    TestBed.tick();
    const addRequest = httpTestingController.expectOne(updateWorkoutExerciseUrl);
    expect(addRequest.request.body).toEqual({ numberOfReps: 4 });
    expect(addButton.disabled).toBe(true);
    expect(subtractButton.disabled).toBe(true);
    addRequest.flush({ workoutTypeId: 1, numberOfReps: 4 });
    await fixture.whenStable();
    expect(addButton.disabled).toBe(false);
    expect(element.querySelector(".workout-number-of-reps")?.textContent).toContain("4");

    subtractButton.click();
    const subtractRequest = httpTestingController.expectOne(updateWorkoutExerciseUrl);
    expect(subtractRequest.request.body.numberOfReps).toEqual(3);
    subtractRequest.flush({ workoutTypeId: 1, numberOfReps: 3 });
    await fixture.whenStable();
    expect(element.querySelector(".workout-number-of-reps")?.textContent).toContain("3");
  });

  it("should enable the buttons again when the update of the reps fails", async () => {
    const errorHandlerService = TestBed.inject(ErrorHandlerService);
    const handleErrorSpy = vi
      .spyOn(errorHandlerService, "handleError")
      .mockImplementation(() => undefined);
    const element = await displaySession([{ workoutTypeId: 1, numberOfReps: 3 }]);
    await toEditMode(element);
    const addButton = element.querySelector<HTMLButtonElement>(".add-rep-to-workout-button")!;

    addButton.click();
    httpTestingController
      .expectOne(updateWorkoutExerciseUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await fixture.whenStable();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de l'ajout d'un exercice."
    );
    expect(addButton.disabled).toBe(false);
    // The number of reps is unchanged
    expect(getDisplayedReps(element)).toEqual("3");
  });

  it("should not remove a rep from an exercise without reps", async () => {
    const element = await displaySession([]);
    await toEditMode(element);

    element.querySelector<HTMLButtonElement>(".subtract-rep-to-workout-button")?.click();
    await fixture.whenStable();

    httpTestingController.expectNone(updateWorkoutExerciseUrl);
    expect(getDisplayedReps(element)).toEqual("0");
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
    // The session is displayed, without reps
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector("mat-spinner")).toBeNull();
    expect(element.querySelector("#workout-session-date")).not.toBeNull();
    expect(getDisplayedReps(element)).toEqual("0");
  });

  it("should not load the exercises of a session without id", async () => {
    fixture.componentRef.setInput("currentWorkoutSessionToEdit", {
      ...currentWorkoutSessionToEdit,
      id: 0
    });
    TestBed.tick();

    await fixture.whenStable();

    httpTestingController.expectNone((request) => request.url.endsWith("/exercises"));
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector("mat-spinner")).not.toBeNull();
    expect(element.querySelector(".workout-exercise-container")).toBeNull();
  });
});
