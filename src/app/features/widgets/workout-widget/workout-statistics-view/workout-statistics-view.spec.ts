import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { WorkoutStatisticsPeriod } from "../workout";
import { WorkoutStatisticsView } from "./workout-statistics-view";

describe("WorkoutStatisticsView", () => {
  let fixture: ComponentFixture<WorkoutStatisticsView>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(WorkoutStatisticsView);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput("workoutTypes", []);
    fixture.componentRef.setInput("workoutStatsByMonth", []);
    fixture.componentRef.setInput("selectedPeriod", WorkoutStatisticsPeriod.LAST_THREE_MONTHS);
    await fixture.whenStable();
  });

  function getPeriods(): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll<HTMLButtonElement>(".workout-period"));
  }

  function getBackButton(): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>(".workout-view button[mat-icon-button]")!;
  }

  it("should display the periods, the selected one and the chart", () => {
    expect(element.querySelector("dash-workout-statistics")).not.toBeNull();
    expect(element.querySelector(".workout-view h3")?.textContent).toContain("Statistiques");
    expect(getPeriods().map((period) => period.textContent?.trim())).toEqual([
      "3 derniers mois",
      "6 derniers mois",
      "Cette année",
      "Année dernière"
    ]);
    expect(getPeriods().map((period) => period.classList.contains("selected"))).toEqual([
      true,
      false,
      false,
      false
    ]);
    expect(getBackButton().getAttribute("aria-label")).toEqual("Retour aux sessions");
  });

  it("should highlight the selected period", async () => {
    for (const [index, period] of [
      WorkoutStatisticsPeriod.LAST_SIX_MONTHS,
      WorkoutStatisticsPeriod.CURRENT_YEAR,
      WorkoutStatisticsPeriod.LAST_YEAR
    ].entries()) {
      fixture.componentRef.setInput("selectedPeriod", period);
      await fixture.whenStable();
      expect(getPeriods().findIndex((button) => button.classList.contains("selected"))).toEqual(
        index + 1
      );
    }
  });

  it("should emit the clicked period", () => {
    const periodSpy = vi.fn();
    fixture.componentInstance.periodSelected.subscribe(periodSpy);

    getPeriods().forEach((period) => period.click());

    expect(periodSpy.mock.calls).toEqual([
      [WorkoutStatisticsPeriod.LAST_THREE_MONTHS],
      [WorkoutStatisticsPeriod.LAST_SIX_MONTHS],
      [WorkoutStatisticsPeriod.CURRENT_YEAR],
      [WorkoutStatisticsPeriod.LAST_YEAR]
    ]);
  });

  it("should request to go back to the sessions list", () => {
    const backSpy = vi.fn();
    fixture.componentInstance.backRequested.subscribe(backSpy);

    getBackButton().click();

    expect(backSpy).toHaveBeenCalledTimes(1);
  });
});
