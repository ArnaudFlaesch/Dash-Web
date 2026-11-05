import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WeatherForecastComponent } from "./weather-forecast.component";
import { ForecastMode, IForecast } from "../weather.model";

/** Forecast at a timestamp in seconds. Not imported from the weather widget spec, so that its tests are not run a second time. */
function forecastAt(dt: number): IForecast {
  return {
    dt,
    dtText: "",
    main: {
      temp: 7.57,
      feelsLike: 5.19,
      tempMin: 7.23,
      tempMax: 7.57,
      pressure: 1022,
      seaLevel: 1022,
      grndLevel: 1018,
      humidity: 45,
      tempKf: 0.34
    },
    weather: [{ id: 800, main: "Clear", description: "ciel dégagé", icon: "01n" }],
    clouds: { all: 0 },
    wind: { speed: 3.68, deg: 43 },
    sys: { pod: "n" }
  };
}

// 06/03/2022 at 18:00 and 21:00 UTC, 07/03/2022 at 09:00 UTC, 09/03/2022 at 16:00 UTC
const forecastData = {
  list: [
    forecastAt(1646589600),
    forecastAt(1646600400),
    forecastAt(1646643600),
    forecastAt(1646841600)
  ]
};

describe("WeatherForecastComponent", () => {
  let component: WeatherForecastComponent;
  let fixture: ComponentFixture<WeatherForecastComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(WeatherForecastComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it("Should get weather icons", () => {
    const icon = "sunny";
    expect(component.getIconFromWeatherApi(icon)).toEqual(
      `https://openweathermap.org/img/wn/${icon}@2x.png`
    );
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
    expect(icon?.src).toEqual(component.getIconFromWeatherApi("01n"));
    expect(icon?.alt).toEqual("ciel dégagé");
    const forecastIcons = [...(firstForecast?.querySelectorAll(".forecast-icons > div") ?? [])];
    expect(forecastIcons.map((line) => line.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      `device_thermostat 8 ${component.labels.celsius}`,
      `device_thermostat 7 ${component.labels.celsius}`,
      `opacity 45${component.labels.percent}`
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
