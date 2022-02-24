import { Component, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { format } from 'date-fns';
import { BaseChartDirective } from 'ng2-charts';
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

  public lineChartOptions: ChartConfiguration['options'] = {
    maintainAspectRatio: false
  };

  public lineChartType: ChartType = 'line';

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

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
    const filteredData = this.filterForecastByMode(cityData, this.forecast);
    return {
      labels: filteredData.map((forecastDay) => {
        if (
          this.forecastMode === ForecastMode.TODAY ||
          this.forecastMode === ForecastMode.TOMORROW
        ) {
          return format(new Date(forecastDay.dt * 1000), 'HH');
        } else {
          return format(new Date(forecastDay.dt * 1000), 'EEE dd MMM');
        }
      }),
      datasets: [
        {
          label: 'Température',
          borderColor: 'orange',
          data: filteredData.map((forecastDay) => forecastDay.main.temp_max)
        },
        {
          label: 'Ressenti',
          borderColor: 'red',
          data: filteredData.map((forecastDay) => forecastDay.main.feels_like)
        }
      ]
    };
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
