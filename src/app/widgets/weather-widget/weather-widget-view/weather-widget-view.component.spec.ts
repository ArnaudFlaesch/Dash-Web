import { ComponentFixture, TestBed } from "@angular/core/testing";

import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { format } from "date-fns";
import { forecastData, weatherData } from "../weather-widget.fixtures";
import { WeatherWidgetService } from "../weather-widget.service";
import { WeatherWidgetViewComponent } from "./weather-widget-view.component";
import { vi } from "vitest";

describe("WeatherWidgetViewComponent", () => {
  let component: WeatherWidgetViewComponent;
  let fixture: ComponentFixture<WeatherWidgetViewComponent>;

  vi.setSystemTime(new Date(2022, 2, 6, 0, 0, 0)); // 06/03/2022

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherWidgetViewComponent],
      providers: [WeatherWidgetService, provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherWidgetViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("weather", weatherData);
    fixture.componentRef.setInput("cityData", forecastData.city);
    fixture.componentRef.setInput("forecastResponse", forecastData.list);
  });

  it("should create", () => {
    expect(component.isForecastModeWeek()).toEqual(false);
    component.selectDayForecast(new Date(component.forecastDays()[0]));
    const dateToSelect = new Date(component.forecastDays()[1]);
    component.selectDayForecast(dateToSelect);
    expect(component.isSelectedDay(dateToSelect)).toEqual(true);
    // Select the same date a second time to check that nothing changes and to cover all possible cases
    component.selectDayForecast(dateToSelect);
    expect(component.isSelectedDay(dateToSelect)).toEqual(true);
    expect(
      component
        .forecastToDisplay()
        .map((forecast) => format(new Date(forecast.dt * 1000), "dd-MM-yyyy"))
    ).toEqual(["07-03-2022"]);
    component.selectWeekForecast();
    expect(component.isSelectedDay(dateToSelect)).toEqual(false);
    component.selectWeekForecast();
  });

  it("Should format date", () => {
    const date = new Date(2022, 5, 1);
    expect(component.formatDate(date)).toEqual("mer. 01");
  });
});

describe("WeatherWidgetViewComponent template", () => {
  let component: WeatherWidgetViewComponent;
  let fixture: ComponentFixture<WeatherWidgetViewComponent>;
  let element: HTMLElement;

  // Forecast at 04:00 in Paris (03:00 UTC) on 07/03/2022, hidden unless the full forecast is displayed
  const earlyForecast = { ...forecastData.list[2], dt: 1646622000 };

  beforeEach(async () => {
    vi.setSystemTime(new Date(2022, 2, 6, 0, 0, 0)); // 06/03/2022
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherWidgetViewComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
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

  function getDisplayedForecastsCount(): number {
    return element.querySelectorAll("dash-weather-forecast .forecast-container").length;
  }

  it("Should display today's weather, one button per forecast day and the week button", () => {
    expect(element.querySelector("dash-weather-today .weather-today-container")).toBeTruthy();
    expect(getDayButtons().map((button) => button.textContent?.trim())).toEqual([
      "Dim. 06",
      "Lun. 07",
      "Mer. 09"
    ]);
    expect(element.querySelector("#toggle-week-forecast")?.textContent?.trim()).toEqual(
      component.labels.week
    );
    expect(element.querySelector("mat-slide-toggle")?.textContent?.trim()).toEqual(
      component.labels.displayFullForecast
    );
  });

  it("Should display the first forecasts of today", () => {
    expect(component.isSelectedDay(component.forecastDays()[0])).toBe(true);
    expect(getDisplayedForecastsCount()).toEqual(5);
  });

  it("Should display the forecast of a selected day from 7 o'clock", async () => {
    getDayButtons()[1].click();
    await fixture.whenStable();
    expect(component.isSelectedDay(component.forecastDays()[1])).toBe(true);
    expect(component.forecastToDisplay()).toEqual([forecastData.list[2]]);
    expect(getDisplayedForecastsCount()).toEqual(1);
  });

  it("Should display the full forecast of a selected day", async () => {
    getDayButtons()[1].click();
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>("mat-slide-toggle button")?.click();
    await fixture.whenStable();

    expect(component.displayAllForecast()).toBe(true);
    expect(component.forecastToDisplay()).toEqual([earlyForecast, forecastData.list[2]]);
    expect(getDisplayedForecastsCount()).toEqual(2);
  });

  it("Should display the afternoon forecast of each day of the week", async () => {
    element.querySelector<HTMLButtonElement>("#toggle-week-forecast")?.click();
    await fixture.whenStable();

    expect(component.isForecastModeWeek()).toBe(true);
    expect(component.isSelectedDay(component.forecastDays()[0])).toBe(false);
    // Only the forecast at 17:00 in Paris (16:00 UTC) is between 15:00 and 18:00
    expect(component.forecastToDisplay()).toEqual([forecastData.list[3]]);
    expect(getDisplayedForecastsCount()).toEqual(1);

    getDayButtons()[0].click();
    await fixture.whenStable();
    expect(component.isForecastModeWeek()).toBe(false);
    expect(getDisplayedForecastsCount()).toEqual(5);
  });
});
