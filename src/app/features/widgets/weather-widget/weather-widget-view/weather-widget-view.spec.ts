import { ComponentFixture, TestBed } from "@angular/core/testing";

import { forecastData, weatherData } from "../weather-widget-fixtures";
import { Forecast } from "../weather";
import { WeatherWidgetView } from "./weather-widget-view";
import { vi } from "vitest";

describe("WeatherWidgetView", () => {
  let fixture: ComponentFixture<WeatherWidgetView>;
  let element: HTMLElement;

  // Forecast at 04:00 in Paris (03:00 UTC) on 07/03/2022, hidden unless the full forecast is displayed
  const earlyForecast = { ...forecastData.list[2], dt: 1646622000 };

  beforeEach(async () => {
    vi.setSystemTime(new Date(2022, 2, 6, 0, 0, 0)); // 06/03/2022

    fixture = TestBed.createComponent(WeatherWidgetView);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput("weather", weatherData);
    fixture.componentRef.setInput("cityData", forecastData.city);
    fixture.componentRef.setInput("forecastResponse", [
      forecastData.list[0],
      forecastData.list[1],
      earlyForecast,
      forecastData.list[2],
      forecastData.list[3]
    ]);
    await fixture.whenStable();
  });

  function getDayButtons(): HTMLButtonElement[] {
    return [...element.querySelectorAll<HTMLButtonElement>(".select-forecast")];
  }

  function getWeekButton(): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>("#toggle-week-forecast")!;
  }

  /** Whether each day button, then the week button, is highlighted as selected. */
  function getSelectedButtons(): boolean[] {
    return [...getDayButtons(), getWeekButton()].map((button) =>
      button.classList.contains("mat-primary")
    );
  }

  function getDisplayedForecastsCount(): number {
    return element.querySelectorAll("dash-weather-forecast .forecast-container").length;
  }

  /** Weather descriptions of the displayed forecasts, which identify them in the test data. */
  function getDisplayedForecastDescriptions(): string[] {
    return [
      ...element.querySelectorAll<HTMLImageElement>("dash-weather-forecast .current-weather-icon")
    ].map((icon) => icon.alt);
  }

  async function click(button: HTMLButtonElement): Promise<void> {
    button.click();
    await fixture.whenStable();
  }

  it("Should display today's weather, one button per forecast day and the week button", () => {
    expect(element.querySelector("dash-weather-today .weather-today-container")).toBeTruthy();
    expect(getDayButtons().map((button) => button.textContent?.trim())).toEqual([
      "Dim. 06",
      "Lun. 07",
      "Mer. 09"
    ]);
    expect(getWeekButton().textContent?.trim()).toEqual("Semaine");
    expect(element.querySelector("mat-slide-toggle")?.textContent?.trim()).toEqual(
      "Afficher les prévisions complètes"
    );
  });

  it("Should display the first forecasts of today", () => {
    expect(getSelectedButtons()).toEqual([true, false, false, false]);
    expect(getDisplayedForecastsCount()).toEqual(5);
  });

  it("Should keep today's forecast when today is selected again", async () => {
    await click(getDayButtons()[0]);
    expect(getSelectedButtons()).toEqual([true, false, false, false]);
    expect(getDisplayedForecastsCount()).toEqual(5);
  });

  it("Should display the forecast of a selected day from 7 o'clock", async () => {
    await click(getDayButtons()[1]);
    expect(getSelectedButtons()).toEqual([false, true, false, false]);
    expect(getDisplayedForecastDescriptions()).toEqual(["Ensoleillé"]);

    // Selecting the same day a second time changes nothing
    await click(getDayButtons()[1]);
    expect(getSelectedButtons()).toEqual([false, true, false, false]);
    expect(getDisplayedForecastDescriptions()).toEqual(["Ensoleillé"]);
  });

  it("Should display the full forecast of a selected day", async () => {
    await click(getDayButtons()[1]);
    await click(element.querySelector<HTMLButtonElement>("mat-slide-toggle button")!);

    expect(element.querySelector("mat-slide-toggle button")?.getAttribute("aria-checked")).toEqual(
      "true"
    );
    // The early forecast and the one at 10:00
    expect(getDisplayedForecastDescriptions()).toEqual(["Ensoleillé", "Ensoleillé"]);
    expect(getDisplayedForecastsCount()).toEqual(2);
  });

  it("Should display the afternoon forecast of each day of the week", async () => {
    await click(getWeekButton());

    expect(getSelectedButtons()).toEqual([false, false, false, true]);
    // Only the forecast at 17:00 in Paris (16:00 UTC) is between 15:00 and 18:00
    expect(getDisplayedForecastDescriptions()).toEqual(["Nuageux"]);

    // Selecting the week a second time changes nothing
    await click(getWeekButton());
    expect(getSelectedButtons()).toEqual([false, false, false, true]);
    expect(getDisplayedForecastDescriptions()).toEqual(["Nuageux"]);

    await click(getDayButtons()[0]);
    expect(getSelectedButtons()).toEqual([true, false, false, false]);
    expect(getDisplayedForecastsCount()).toEqual(5);
  });

  it("Should display a single afternoon forecast per day of the week", async () => {
    const forecastAt = (dt: number, description: string): Forecast => ({
      ...forecastData.list[3],
      dt,
      weather: [{ ...forecastData.list[3].weather[0], description }]
    });
    // 15:00 and 18:00 in Paris on 08/03/2022
    fixture.componentRef.setInput("forecastResponse", [
      forecastAt(1646748000, "15:00"),
      forecastAt(1646758800, "18:00")
    ]);
    await fixture.whenStable();
    await click(getWeekButton());

    expect(getDisplayedForecastDescriptions()).toEqual(["15:00"]);
  });

  it("Should display no forecast day without forecast", async () => {
    fixture.componentRef.setInput("forecastResponse", []);
    await fixture.whenStable();
    expect(getDayButtons()).toHaveLength(0);
    expect(getSelectedButtons()).toEqual([false]);
    expect(getDisplayedForecastsCount()).toEqual(0);
  });
});
