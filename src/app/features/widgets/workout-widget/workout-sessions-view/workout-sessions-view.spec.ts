import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { MatDatepickerInputHarness } from "@angular/material/datepicker/testing";
import { provideDateFnsAdapter } from "@angular/material-date-fns-adapter";
import { By } from "@angular/platform-browser";
import { fr } from "date-fns/locale";
import { vi } from "vitest";
import { WorkoutSessionsView } from "./workout-sessions-view";

describe("WorkoutSessionsView", () => {
  let fixture: ComponentFixture<WorkoutSessionsView>;
  let component: WorkoutSessionsView;
  let element: HTMLElement;

  const workoutSession = { id: 1, workoutDate: "2026-10-20", userId: 2 };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideDateFnsAdapter(), { provide: MAT_DATE_LOCALE, useValue: fr }]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutSessionsView);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput("workoutTypes", []);
    fixture.componentRef.setInput("workoutSessions", []);
    fixture.componentRef.setInput("workoutStatsByWeek", []);
    fixture.componentRef.setInput("workoutStatsByMonth", []);
    await fixture.whenStable();
  });

  function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return element.querySelector<T>(selector);
  }

  async function typeWorkoutTypeName(name: string): Promise<void> {
    const input = query<HTMLInputElement>("#add-workout-input")!;
    input.value = name;
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
  }

  function getDatepickerInput(fieldSelector: string): Promise<MatDatepickerInputHarness> {
    return TestbedHarnessEnvironment.loader(fixture).getHarness(
      MatDatepickerInputHarness.with({ selector: `${fieldSelector} input` })
    );
  }

  it("should display the sessions, the statistics and the workout types", async () => {
    fixture.componentRef.setInput("workoutTypes", [{ id: 1, name: "Abdos", userId: 2 }]);
    fixture.componentRef.setInput("workoutSessions", [workoutSession]);
    fixture.componentRef.setInput("workoutStatsByWeek", [
      { workoutTypeName: "Abdos", totalNumberOfReps: 50 }
    ]);
    fixture.componentRef.setInput("workoutStatsByMonth", [
      { workoutTypeName: "Abdos", totalNumberOfReps: 120 }
    ]);
    await fixture.whenStable();

    expect(element.querySelectorAll(".workout-session")).toHaveLength(1);
    expect(query(".workout-session")?.textContent).toContain("20/10/2026");
    expect(query("#workout-stats-by-week-container")?.textContent).toContain("Cette semaine");
    expect(query("#workout-stats-by-week-container .workout-stat")?.textContent).toContain("Abdos");
    expect(query("#workout-stats-by-week-container .workout-stat-reps")?.textContent).toContain(
      "50"
    );
    expect(query("#workout-stats-by-month-container")?.textContent).toContain("Ce mois-ci");
    expect(query("#workout-stats-by-month-container .workout-stat-reps")?.textContent).toContain(
      "120"
    );
    expect(query("#workout-types-grid .workout-type-name")?.textContent).toContain("Abdos");
    expect(query(".workout-empty-message")).toBeNull();
  });

  it("should display the empty states", () => {
    const emptyMessages = element.querySelectorAll(".workout-empty-message");
    expect(emptyMessages).toHaveLength(2);
    expect(emptyMessages[0].textContent).toContain("Aucune session ce mois-ci.");
    expect(emptyMessages[1].textContent).toContain("Aucun type d'exercice.");
    expect(query(".workout-stats-cards")).toBeNull();
    // The forms are empty, so they cannot be submitted
    expect(query<HTMLButtonElement>("#create-workout-session-button")?.disabled).toBe(true);
    expect(query<HTMLButtonElement>("#add-workout-type-button")?.disabled).toBe(true);
  });

  it("should display only the statistics of the month", async () => {
    fixture.componentRef.setInput("workoutStatsByMonth", [
      { workoutTypeName: "Pompes", totalNumberOfReps: 30 }
    ]);
    await fixture.whenStable();

    expect(query("#workout-stats-by-week-container")).toBeNull();
    expect(query("#workout-stats-by-month-container .workout-stat-reps")?.textContent).toContain(
      "30"
    );
  });

  it("should request the statistics view and the edition of a session", async () => {
    fixture.componentRef.setInput("workoutSessions", [workoutSession]);
    await fixture.whenStable();
    const statisticsSpy = vi.fn();
    const sessionSpy = vi.fn();
    component.statisticsRequested.subscribe(statisticsSpy);
    component.workoutSessionSelected.subscribe(sessionSpy);

    Array.from(element.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Statistiques"))
      ?.click();
    query(".workout-session")?.click();

    expect(statisticsSpy).toHaveBeenCalledTimes(1);
    expect(sessionSpy).toHaveBeenCalledWith(workoutSession);
  });

  it("should request the addition of the typed workout type, then empty the input", async () => {
    const addSpy = vi.fn();
    component.workoutTypeAdditionRequested.subscribe(addSpy);
    const input = query<HTMLInputElement>("#add-workout-input");
    const addButton = query<HTMLButtonElement>("#add-workout-type-button");
    expect(input?.closest("mat-form-field")?.querySelector("mat-label")?.textContent).toContain(
      "Ajouter un type d'exercice"
    );
    expect(addButton?.textContent).toContain("Ajouter");
    expect(input?.placeholder).toEqual("Pompes, tractions…");

    await typeWorkoutTypeName("Pompes");
    expect(component.workoutName()).toEqual("Pompes");
    expect(addButton?.disabled).toBe(false);
    addButton?.click();
    expect(addSpy).toHaveBeenCalledWith("Pompes");

    // Emptied by the parent once the workout type is added
    fixture.componentRef.setInput("workoutName", "");
    await fixture.whenStable();
    expect(input?.value).toEqual("");
    expect(addButton?.disabled).toBe(true);
  });

  it("should request the creation of a session at the picked date", async () => {
    const createSpy = vi.fn();
    component.workoutSessionCreationRequested.subscribe(createSpy);
    const workoutDateInput = await getDatepickerInput("#workout-date-picker-field");
    await workoutDateInput.setValue("01/09/2022");
    await workoutDateInput.blur();
    const createButton = query<HTMLButtonElement>("#create-workout-session-button");
    expect(createButton?.disabled).toBe(false);
    expect(createButton?.textContent).toContain("Créer");

    createButton?.click();
    expect(createSpy).toHaveBeenCalledWith(new Date(2022, 8, 1));
  });

  it("should not send invalid forms", async () => {
    const addSpy = vi.fn();
    const createSpy = vi.fn();
    component.workoutTypeAdditionRequested.subscribe(addSpy);
    component.workoutSessionCreationRequested.subscribe(createSpy);
    await typeWorkoutTypeName("   ");
    expect(query<HTMLButtonElement>("#add-workout-type-button")?.disabled).toBe(true);
    expect(query<HTMLButtonElement>("#create-workout-session-button")?.disabled).toBe(true);

    // Even if the (disabled) buttons are triggered
    fixture.debugElement
      .query(By.css("#add-workout-type-button"))
      .triggerEventHandler("click", new MouseEvent("click"));
    fixture.debugElement
      .query(By.css("#create-workout-session-button"))
      .triggerEventHandler("click", new MouseEvent("click"));

    expect(addSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("should select the month picked in the datepicker", async () => {
    const monthInput = await getDatepickerInput(".workout-month-field");
    expect(query(".workout-month-field mat-label")?.textContent).toContain("Mois");
    await monthInput.openCalendar();
    const calendar = await monthInput.getCalendar();
    await calendar.selectCell({ text: "2022" });

    // The calendar is closed once the month is picked, so the click is not awaited by a harness
    const novemberCell = Array.from(
      document.querySelectorAll<HTMLElement>(".mat-calendar-body-cell")
    ).find((cell) => cell.textContent?.trim().toLowerCase().startsWith("nov"));
    novemberCell?.click();
    await fixture.whenStable();

    expect(component.selectedMonth()).toEqual(new Date(2022, 10, 1));
    expect(await monthInput.isCalendarOpen()).toBe(false);
    expect(await monthInput.getValue()).toEqual("01/11/2022");
  });
});
