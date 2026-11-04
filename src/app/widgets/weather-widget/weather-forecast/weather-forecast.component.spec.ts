import { TestBed } from "@angular/core/testing";
import { WeatherWidgetService } from "../weather-widget.service";
import { WeatherForecastComponent } from "./weather-forecast.component";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("WeatherForecastComponent", () => {
  let component: WeatherForecastComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [WeatherWidgetService, provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    const fixture = TestBed.createComponent(WeatherForecastComponent);
    component = fixture.componentInstance;
  });

  it("Should get weather icons", () => {
    const icon = "sunny";
    expect(component.getIconFromWeatherApi(icon)).toEqual(
      `https://openweathermap.org/img/wn/${icon}@2x.png`
    );
  });
});
