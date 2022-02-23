import { DateUtilsService } from './../../utils/DateUtils';
import { WeatherWidgetService } from './weather.widget.service';
import { Component } from '@angular/core';
import { IWeather, IForecast, ICity, IWeatherAPIResponse } from './IWeather';

enum ForecastMode {
  TODAY,
  TOMORROW,
  WEEK
}

@Component({
  selector: 'app-weather-widget',
  templateUrl: './weather-widget.component.html',
  styleUrls: ['./weather-widget.component.scss']
})
export class WeatherWidgetComponent {
  public city = 'Paris';
  public cityForm = '';

  public weather: IWeather | undefined;
  public forecast: IForecast[] = [];
  public cityData: ICity | undefined;
  public forecastMode = ForecastMode.WEEK;

  constructor(
    private weatherWidgetService: WeatherWidgetService,
    public dateUtils: DateUtilsService
  ) {}

  public refreshWidget() {
    this.weatherWidgetService.fetchWeatherData(this.city).subscribe({
      next: (weatherData) => (this.weather = weatherData),
      error: (error) => console.error(error.message)
    });
    this.weatherWidgetService.fetchForecastData(this.city).subscribe({
      next: (forecastApiResponse: IWeatherAPIResponse) => {
        this.forecast = forecastApiResponse.list;
        this.cityData = forecastApiResponse.city;
      },
      error: (error) => console.error(error.message)
    });
  }

  public filterForecastByMode(): IForecast[] {
    if (this.cityData && this.forecast) {
      switch (this.forecastMode) {
        case ForecastMode.WEEK: {
          return this.forecast.filter((forecastDay) => {
            const forecastElement = this.dateUtils.formatDateFromTimestamp(
              forecastDay.dt,
              this.dateUtils.adjustTimeWithOffset(this.cityData!.timezone)
            );
            return forecastElement.getHours() >= 15 && forecastElement.getHours() <= 18;
          });
        }
        case ForecastMode.TOMORROW: {
          return this.forecast.filter(
            (forecastDay) =>
              new Date(forecastDay.dt * 1000).getDay() ===
                new Date(+new Date() + 86400000).getDay() &&
              new Date(forecastDay.dt * 1000).getHours() >= 7
          );
        }
        case ForecastMode.TODAY: {
          return this.forecast.filter(
            (forecastDay) =>
              new Date(forecastDay.dt * 1000).getDay() === new Date().getDay() &&
              new Date(forecastDay.dt * 1000).getHours() >= 7
          );
        }
      }
    } else {
      return [];
    }
  }

  public getCurrentWeatherIcon() {
    return `https://openweathermap.org/img/wn/${this.weather?.weather[0].icon}@2x.png`;
  }

  public getIconFromWeatherApi(icon: string) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }

  public selectTodayForecast(): void {
    this.forecastMode = ForecastMode.TODAY;
  }

  public selectTomorrowForecast(): void {
    this.forecastMode = ForecastMode.TOMORROW;
  }

  public selectWeekForecast(): void {
    this.forecastMode = ForecastMode.WEEK;
  }
}
