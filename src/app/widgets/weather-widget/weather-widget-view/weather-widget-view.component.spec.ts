import { ComponentFixture, TestBed } from "@angular/core/testing";

import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { SimpleChange } from "@angular/core";
import { format } from "date-fns";
import { advanceTo } from "jest-date-mock";
import { DateUtilsService } from "../../../services/date.utils.service/date.utils.service";
import { forecastData, weatherData } from "../weather-widget.component.spec";
import { WeatherWidgetService } from "../weather.widget.service";
import { WeatherWidgetViewComponent } from "./weather-widget-view.component";

describe("WeatherWidgetViewComponent", () => {
  let component: WeatherWidgetViewComponent;
  let fixture: ComponentFixture<WeatherWidgetViewComponent>;

  advanceTo(new Date(2022, 2, 6, 0, 0, 0)); // 06/03/2022

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherWidgetViewComponent],
      providers: [
        DateUtilsService,
        WeatherWidgetService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherWidgetViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("weather", weatherData);
    fixture.componentRef.setInput("cityData", forecastData.city);
    fixture.componentRef.setInput("forecastResponse", forecastData.list);
    fixture.detectChanges();
  });

  it("should create", () => {
    component.ngOnChanges({ forecastResponse: new SimpleChange({}, forecastData.list, true) });
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
