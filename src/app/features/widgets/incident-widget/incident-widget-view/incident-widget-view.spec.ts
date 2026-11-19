import { ComponentFixture, TestBed } from "@angular/core/testing";
import { startOfYesterday } from "date-fns";
import { vi } from "vitest";
import { IncidentStreak } from "../incident";
import { IncidentWidgetView } from "./incident-widget-view";

describe("IncidentWidgetView", () => {
  // Most recent first, as given by the widget
  const streaks: IncidentStreak[] = [
    { streakStartDate: "2022-08-01T00:00:00Z", streakEndDate: "2022-08-04T00:00:00Z" },
    // Local dates, a month long
    {
      streakStartDate: new Date(2022, 6, 1, 0, 0, 0).toString(),
      streakEndDate: new Date(2022, 7, 1, 0, 0, 0).toString()
    },
    { streakStartDate: "2022-07-01T00:00:00Z", streakEndDate: "2022-07-11T00:00:00Z" }
  ];

  let fixture: ComponentFixture<IncidentWidgetView>;
  let element: HTMLElement;

  async function createView(
    lastIncidentDate: string | undefined,
    pastStreaks: IncidentStreak[] = []
  ): Promise<void> {
    fixture = TestBed.createComponent(IncidentWidgetView);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput("lastIncidentDate", lastIncidentDate);
    fixture.componentRef.setInput("streaks", pastStreaks);
    await fixture.whenStable();
  }

  function findButton(text: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(text)
    );
  }

  function getDaysSinceLastIncident(): string | undefined {
    return element.querySelector("#number-of-days-since-last-incident")?.textContent?.trim();
  }

  it("should request a new streak when the incident has never happened", async () => {
    await createView(undefined);
    const newStreakRequestedSpy = vi.fn();
    fixture.componentInstance.newStreakRequested.subscribe(newStreakRequestedSpy);

    expect(element.querySelector("#incident-widget-body")).toBeNull();
    findButton("Départ")?.click();
    expect(newStreakRequestedSpy).toHaveBeenCalledTimes(1);
  });

  it("should display the current streak, without past streaks", async () => {
    await createView(startOfYesterday().toISOString());

    expect(element.querySelector("#incident-widget-body-header")?.textContent).toContain(
      "Dernier incident le"
    );
    expect(getDaysSinceLastIncident()).toEqual("1 jours");
    expect(element.querySelector("#end-current-streak-button")?.textContent).toContain("Terminer");
    expect(findButton("Séries précédentes")).toBeUndefined();
    expect(findButton("Départ")).toBeUndefined();
  });

  it("should request the end of the current streak", async () => {
    await createView(startOfYesterday().toISOString());
    const streakEndRequestedSpy = vi.fn();
    fixture.componentInstance.streakEndRequested.subscribe(streakEndRequestedSpy);

    element.querySelector<HTMLButtonElement>("#end-current-streak-button")!.click();
    expect(streakEndRequestedSpy).toHaveBeenCalledTimes(1);
  });

  it("should switch between the current streak and the past streaks", async () => {
    await createView(startOfYesterday().toISOString(), streaks);

    findButton("Séries précédentes")?.click();
    await fixture.whenStable();
    expect(element.querySelector("#incident-widget-body")).toBeNull();
    const pastStreaks = [...element.querySelectorAll("#past-streaks-list > div")].map((streak) =>
      streak.textContent?.trim()
    );
    // Number of days of each streak, in the given order
    expect(pastStreaks).toEqual(["3 jours", "31 jours", "10 jours"]);
    expect(element.querySelector("#go-to-current-streak-button")?.textContent).toContain(
      "Série actuelle"
    );

    element.querySelector<HTMLButtonElement>("#go-to-current-streak-button")!.click();
    await fixture.whenStable();
    expect(element.querySelector("#past-streaks-list")).toBeNull();
    expect(element.querySelector("#incident-widget-body")).not.toBeNull();
  });
});
