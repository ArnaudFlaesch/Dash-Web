import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WeatherToday } from "./weather-today";
import { DecimalPipe } from "@angular/common";
import { LOCALE_ID } from "@angular/core";
import { weatherData } from "../weather-widget-fixtures";

describe("WeatherToday", () => {
  let fixture: ComponentFixture<WeatherToday>;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(WeatherToday);
    element = fixture.nativeElement as HTMLElement;
  });

  it("Should display the current weather", async () => {
    fixture.componentRef.setInput("weather", weatherData);
    await fixture.whenStable();

    const icon = element.querySelector<HTMLImageElement>(".current-weather-icon");
    expect(icon?.src).toEqual("https://openweathermap.org/img/wn/01d@2x.png");
    expect(icon?.alt).toEqual("ciel dégagé");
    expect(element.querySelector(".current-temperature-container > div")?.textContent).toEqual(
      "Ciel dégagé"
    );
    const temperature = new DecimalPipe(TestBed.inject(LOCALE_ID)).transform(7.57, "1.0-1");
    expect(element.querySelector(".temperature")?.textContent?.trim()).toEqual(`${temperature} °C`);
  });

  it("Should display the times in the timezone of the city", async () => {
    // Paris is in UTC+1: sunrise at 06:23:08 UTC, sunset at 17:40:59 UTC, update at 17:10:17 UTC
    fixture.componentRef.setInput("weather", weatherData);
    await fixture.whenStable();

    const times = [...element.querySelectorAll(".time-container > div")].map(
      (time) => time.textContent
    );
    expect(times).toEqual(["07:23:08", "18:40:59", "18:10:17"]);
  });

  it("Should display the times of a city in another timezone", async () => {
    // New York is in UTC-5: sunrise at 06:23:08 UTC is 01:23:08 there
    fixture.componentRef.setInput("weather", { ...weatherData, timezone: -18000 });
    await fixture.whenStable();
    expect(element.querySelector(".time-container > div")?.textContent).toEqual("01:23:08");
  });

  it("Should display nothing without weather description", async () => {
    fixture.componentRef.setInput("weather", {
      ...weatherData,
      weather: undefined
    });
    await fixture.whenStable();
    expect(element.querySelector(".weather-today-container")).toBeNull();
  });
});
