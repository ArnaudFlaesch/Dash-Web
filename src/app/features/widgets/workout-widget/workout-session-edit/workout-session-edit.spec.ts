import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { WorkoutExercise, WorkoutRepsChange, WorkoutSession, WorkoutType } from "../workout";
import { WorkoutSessionEdit } from "./workout-session-edit";

describe("WorkoutSessionEdit", () => {
  let fixture: ComponentFixture<WorkoutSessionEdit>;
  let element: HTMLElement;
  let numberOfRepsChanges: WorkoutRepsChange[];

  const workoutTypes = [{ id: 1, name: "Abdos" } as WorkoutType];
  const newWorkoutSessionDate = new Date(2022, 8, 1, 0, 0, 0).toString();
  const workoutSession = {
    id: 1,
    workoutDate: newWorkoutSessionDate
  } as WorkoutSession;

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkoutSessionEdit);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput("workoutTypes", workoutTypes);
    fixture.componentRef.setInput("workoutSession", workoutSession);
    fixture.componentRef.setInput("workoutExercises", []);
    fixture.componentRef.setInput("isLoaded", true);
    fixture.componentRef.setInput("isUpdating", false);
    numberOfRepsChanges = [];
    fixture.componentInstance.numberOfRepsChanged.subscribe((change) =>
      numberOfRepsChanges.push(change)
    );
  });

  /** Displays the edited session, with the given exercises. */
  async function displaySession(workoutExercises: WorkoutExercise[]): Promise<void> {
    fixture.componentRef.setInput("workoutExercises", workoutExercises);
    await fixture.whenStable();
  }

  async function toEditMode(): Promise<void> {
    element.querySelector<HTMLButtonElement>("#edit-session-button")?.click();
    await fixture.whenStable();
  }

  function getDisplayedReps(): string | undefined {
    return element
      .querySelector(".workout-exercise-container .edit-reps-container > span")
      ?.textContent?.trim();
  }

  function getAddButton(): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>(".add-rep-to-workout-button")!;
  }

  function getSubtractButton(): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>(".subtract-rep-to-workout-button")!;
  }

  it("should display a spinner until the exercises are loaded", async () => {
    fixture.componentRef.setInput("isLoaded", false);
    await fixture.whenStable();
    expect(element.querySelector("mat-spinner")).not.toBeNull();
    expect(element.querySelector("#workout-session-date")).toBeNull();
    expect(element.querySelector(".workout-exercise-container")).toBeNull();

    fixture.componentRef.setInput("isLoaded", true);
    await fixture.whenStable();

    expect(element.querySelector("mat-spinner")).toBeNull();
    // Exact text, without surrounding spaces, as checked by the end-to-end tests
    expect(element.querySelector("#workout-session-date")?.textContent).toEqual(
      `Session du ${new Date(workoutSession.workoutDate).toLocaleDateString("fr")}`
    );
  });

  it("should display the workout types with their number of reps", async () => {
    fixture.componentRef.setInput("workoutTypes", [
      ...workoutTypes,
      { id: 2, name: "Pompes" } as WorkoutType
    ]);
    await displaySession([{ workoutTypeId: 1, numberOfReps: 12 }]);

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
    await displaySession([]);

    expect(element.querySelector(".workout-no-exercise")?.textContent).toContain(
      "Ajoutez des types d'exercices pour compter vos répétitions."
    );
    expect(element.querySelector(".workout-exercise-container")).toBeNull();
  });

  it("should switch between the read and the edit modes", async () => {
    await displaySession([]);
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
    expect(getAddButton().getAttribute("aria-label")).toEqual("Ajouter une répétition : Abdos");
    expect(getSubtractButton().getAttribute("aria-label")).toEqual(
      "Retirer une répétition : Abdos"
    );

    element.querySelector<HTMLButtonElement>("#validate-session-button")!.click();
    await fixture.whenStable();
    expect(element.querySelector("#edit-session-button")).not.toBeNull();
    expect(element.querySelector(".add-rep-to-workout-button")).toBeNull();
  });

  it("should emit the new number of reps when a rep is added or removed", async () => {
    await displaySession([{ workoutTypeId: 1, numberOfReps: 3 }]);
    await toEditMode();

    getAddButton().click();
    getSubtractButton().click();

    expect(numberOfRepsChanges).toEqual([
      { workoutTypeId: 1, numberOfReps: 4 },
      { workoutTypeId: 1, numberOfReps: 2 }
    ]);
  });

  it("should add a rep to an exercise without reps", async () => {
    await displaySession([]);
    expect(getDisplayedReps()).toEqual("0");
    await toEditMode();

    getAddButton().click();
    expect(numberOfRepsChanges).toEqual([{ workoutTypeId: 1, numberOfReps: 1 }]);

    // Once updated by the parent
    await displaySession([{ workoutTypeId: 1, numberOfReps: 1 }]);
    expect(element.querySelector(".workout-number-of-reps")?.textContent).toContain("1");
    await displaySession([{ workoutTypeId: 1, numberOfReps: 0 }]);
    expect(element.querySelector(".workout-number-of-reps")).toBeNull();
    expect(getDisplayedReps()).toEqual("0");
  });

  it("should not remove a rep from an exercise without reps", async () => {
    const emitSpy = vi.spyOn(fixture.componentInstance.numberOfRepsChanged, "emit");
    await displaySession([]);
    await toEditMode();

    getSubtractButton().click();
    await fixture.whenStable();

    expect(emitSpy).not.toHaveBeenCalled();
    expect(getDisplayedReps()).toEqual("0");
  });

  it("should disable the buttons while an update is sent", async () => {
    await displaySession([{ workoutTypeId: 1, numberOfReps: 3 }]);
    await toEditMode();
    expect(getAddButton().disabled).toBe(false);
    expect(getSubtractButton().disabled).toBe(false);

    fixture.componentRef.setInput("isUpdating", true);
    await fixture.whenStable();
    expect(getAddButton().disabled).toBe(true);
    expect(getSubtractButton().disabled).toBe(true);

    fixture.componentRef.setInput("isUpdating", false);
    await fixture.whenStable();
    expect(getAddButton().disabled).toBe(false);
  });
});
