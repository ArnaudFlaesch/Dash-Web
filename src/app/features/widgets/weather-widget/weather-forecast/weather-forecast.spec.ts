import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WeatherForecast } from "./weather-forecast";
import { ForecastMode } from "../weather";
import { forecastData } from "../weather-widget-fixtures";

// The test forecasts are on 06/03/2022 at 18:00 and 21:00 UTC, 07/03/2022 at 09:00 UTC and 09/03/2022 at 16:00 UTC
describe("WeatherForecast", () => {
  let fixture: ComponentFixture<WeatherForecast>;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(WeatherForecast);
    element = fixture.nativeElement as HTMLElement;
  });

  function getForecastTimes(): string[] {
    return [...element.querySelectorAll(".forecast-time")].map(
      (time) => time.textContent?.trim() ?? ""
    );
  }

  it("Should display nothing without forecast", async () => {
    fixture.componentRef.setInput("forecast", []);
    await fixture.whenStable();
    expect(element.querySelectorAll(".forecast-container")).toHaveLength(0);
  });

  it("Should display the forecast of the day with the hours of the city", async () => {
    fixture.componentRef.setInput("forecast", forecastData.list);
    fixture.componentRef.setInput("timezone", 3600);
    await fixture.whenStable();

    expect(element.querySelectorAll(".forecast-container")).toHaveLength(4);
    // 18:00, 21:00, 09:00 and 16:00 UTC in Paris (UTC+1)
    const hours = [19, 22, 10, 17].map((hour) =>
      new Date(2022, 2, 6, hour).toLocaleString("fr", { hour: "2-digit" })
    );
    expect(getForecastTimes()).toEqual(hours);

    const firstForecast = element.querySelector(".forecast-container");
    const icon = firstForecast?.querySelector<HTMLImageElement>(".current-weather-icon");
    expect(icon?.src).toEqual("https://openweathermap.org/img/wn/01n@2x.png");
    expect(icon?.alt).toEqual("ciel dégagé");
    const forecastIcons = [...(firstForecast?.querySelectorAll(".forecast-icons > div") ?? [])];
    expect(forecastIcons.map((line) => line.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "device_thermostat 8 °C",
      "device_thermostat 7 °C",
      "opacity 45%"
    ]);
  });

  it("Should display the days of the week forecast", async () => {
    fixture.componentRef.setInput("forecast", [forecastData.list[0], forecastData.list[3]]);
    fixture.componentRef.setInput("timezone", 3600);
    fixture.componentRef.setInput("forecastMode", ForecastMode.WEEK);
    await fixture.whenStable();

    const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric" };
    expect(getForecastTimes()).toEqual([
      new Date(2022, 2, 6, 19).toLocaleString("fr", options),
      new Date(2022, 2, 9, 17).toLocaleString("fr", options)
    ]);
  });

  it("Should display the day of the city, not of the browser", async () => {
    // 18:00 UTC on 06/03 is already 07/03 in Tokyo (UTC+9)
    fixture.componentRef.setInput("forecast", [forecastData.list[0]]);
    fixture.componentRef.setInput("timezone", 32400);
    fixture.componentRef.setInput("forecastMode", ForecastMode.WEEK);
    await fixture.whenStable();
    expect(getForecastTimes()).toEqual([
      new Date(2022, 2, 7, 3).toLocaleString("fr", { weekday: "short", day: "numeric" })
    ]);
  });
});
