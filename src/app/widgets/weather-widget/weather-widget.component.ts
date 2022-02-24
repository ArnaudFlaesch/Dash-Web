import { Component } from '@angular/core';
import { format } from 'date-fns';
import { DateUtilsService } from '../../utils/date.utils';
import { ICity, IForecast, IWeather, IWeatherAPIResponse } from './IWeather';
import { WeatherWidgetService } from './weather.widget.service';

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
  public forecastMode = ForecastMode.TODAY;

  public view: [number, number] = [700, 300];

  // options
  public legend = true;
  public showLabels = true;
  public animations = true;
  public xAxis = true;
  public yAxis = true;
  public showYAxisLabel = true;
  public showXAxisLabel = true;
  public xAxisLabel = 'Heure';
  public yAxisLabel = 'Température';
  public timeline = true;

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

  public filterForecastByMode(cityData: ICity, forecastData: IForecast[]): IForecast[] {
    switch (this.forecastMode) {
      case ForecastMode.WEEK: {
        return forecastData.filter((forecastDay) => {
          const forecastElement = this.dateUtils.formatDateFromTimestamp(
            forecastDay.dt,
            this.dateUtils.adjustTimeWithOffset(cityData.timezone)
          );
          return forecastElement.getHours() >= 15 && forecastElement.getHours() <= 18;
        });
      }
      case ForecastMode.TOMORROW: {
        return forecastData.filter(
          (forecastDay) =>
            new Date(forecastDay.dt * 1000).getDay() ===
              new Date(+new Date() + 86400000).getDay() &&
            new Date(forecastDay.dt * 1000).getHours() >= 7
        );
      }
      case ForecastMode.TODAY: {
        return forecastData.filter(
          (forecastDay) =>
            new Date(forecastDay.dt * 1000).getDay() === new Date().getDay() &&
            new Date(forecastDay.dt * 1000).getHours() >= 7
        );
      }
    }
  }

  public getWeatherChart(cityData: ICity) {
    return [
      {
        name: 'Température',
        series: this.filterForecastByMode(cityData, this.forecast).map((forecastDay) => {
          if (
            this.forecastMode === ForecastMode.TODAY ||
            this.forecastMode === ForecastMode.TOMORROW
          ) {
            return {
              name: format(new Date(forecastDay.dt * 1000), 'HH'),
              value: forecastDay.main.temp_max
            };
          } else {
            return {
              name: format(new Date(forecastDay.dt * 1000), 'EEE dd MMM'),
              value: forecastDay.main.temp_max
            };
          }
        })
      },
      {
        name: 'Ressenti',
        series: this.filterForecastByMode(cityData, this.forecast).map((forecastDay) => {
          if (
            this.forecastMode === ForecastMode.TODAY ||
            this.forecastMode === ForecastMode.TOMORROW
          ) {
            return {
              name: format(new Date(forecastDay.dt * 1000), 'HH'),
              value: forecastDay.main.feels_like
            };
          } else {
            return {
              name: format(new Date(forecastDay.dt * 1000), 'EEE dd MMM'),
              value: forecastDay.main.feels_like
            };
          }
        })
      }
    ];
  }

  public getIconFromWeatherApi = (icon: string) =>
    `https://openweathermap.org/img/wn/${icon}@2x.png`;

  public isForecastModeToday = () => this.forecastMode === ForecastMode.TODAY;
  public isForecastModeTomorrow = () => this.forecastMode === ForecastMode.TOMORROW;
  public isForecastModeWeek = () => this.forecastMode === ForecastMode.WEEK;

  public selectTodayForecast = () => (this.forecastMode = ForecastMode.TODAY);
  public selectTomorrowForecast = () => (this.forecastMode = ForecastMode.TOMORROW);
  public selectWeekForecast = () => (this.forecastMode = ForecastMode.WEEK);
}
