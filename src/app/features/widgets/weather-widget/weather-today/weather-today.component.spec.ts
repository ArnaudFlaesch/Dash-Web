import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WeatherTodayComponent } from "./weather-today.component";
import { DecimalPipe } from "@angular/common";
import { LOCALE_ID } from "@angular/core";
import { IWeatherAPIResponse } from "../weather.model";

// Not imported from the weather widget spec, so that its tests are not run a second time
const weatherData: IWeatherAPIResponse = {
  coord: { lon: 2.3488, lat: 48.8534 },
  weather: [{ id: 800, main: "Clear", description: "ciel dégagé", icon: "01d" }],
  base: "stations",
  main: {
    temp: 7.57,
    feels_like: 3.75,
    tempMin: 6.11,
    tempMax: 8.54,
    pressure: 1022,
    humidity: 45
  },
  visibility: 10000,
  wind: { speed: 7.2, deg: 50, gust: 0 },
  clouds: { all: 0 },
  dt: 1646586617,
  sys: { type: 2, id: 2041230, country: "FR", sunrise: 1646547788, sunset: 1646588459 },
  timezone: 3600,
  id: 2988507,
  name: "Paris",
  cod: 200
};

describe("WeatherTodayComponent", () => {
  let component: WeatherTodayComponent;
  let fixture: ComponentFixture<WeatherTodayComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(WeatherTodayComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it("Should get weather icons", () => {
    const icon = "sunny";
    expect(component.getIconFromWeatherApi(icon)).toEqual(
      `https://openweathermap.org/img/wn/${icon}@2x.png`
    );
  });

  it("Should display the current weather", async () => {
    fixture.componentRef.setInput("weather", weatherData);
    await fixture.whenStable();

    const icon = element.querySelector<HTMLImageElement>(".current-weather-icon");
    expect(icon?.src).toEqual(component.getIconFromWeatherApi("01d"));
    expect(icon?.alt).toEqual("ciel dégagé");
    expect(element.querySelector(".current-temperature-container > div")?.textContent).toEqual(
      "Ciel dégagé"
    );
    const temperature = new DecimalPipe(TestBed.inject(LOCALE_ID)).transform(7.57, "1.0-1");
    expect(element.querySelector(".temperature")?.textContent?.trim()).toEqual(
      `${temperature} ${component.labels.celsius}`
    );
  });

  it("Should display the times in the timezone of the city", async () => {
    // Paris is in UTC+1: sunrise at 06:23:08 UTC, sunset at 17:40:59 UTC, update at 17:10:17 UTC
    fixture.componentRef.setInput("weather", weatherData);
    await fixture.whenStable();

    expect(component.sunriseTime()).toEqual("07:23:08");
    expect(component.sunsetTime()).toEqual("18:40:59");
    expect(component.lastUpdateTime()).toEqual("18:10:17");
    const times = [...element.querySelectorAll(".time-container > div")].map(
      (time) => time.textContent
    );
    expect(times).toEqual(["07:23:08", "18:40:59", "18:10:17"]);
  });

  it("Should display the times of a city in another timezone", async () => {
    // New York is in UTC-5: sunrise at 06:23:08 UTC is 01:23:08 there
    fixture.componentRef.setInput("weather", { ...weatherData, timezone: -18000 });
    await fixture.whenStable();
    expect(component.sunriseTime()).toEqual("01:23:08");
  });

  it("Should display nothing without weather description", async () => {
    fixture.componentRef.setInput("weather", {
      ...weatherData,
      weather: undefined
    } as unknown as IWeatherAPIResponse);
    await fixture.whenStable();
    expect(element.querySelector(".weather-today-container")).toBeNull();
  });
});
