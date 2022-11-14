import { Component } from '@angular/core';
import { ChartData, ChartTypeRegistry } from 'chart.js';
import { format, startOfDay } from 'date-fns';

import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { ErrorHandlerService } from './../../services/error.handler.service';
import {
  ICity,
  IForecast,
  IForecastAPIResponse,
  IWeatherAPIResponse
} from './IWeather';
import { WeatherWidgetService } from './weather.widget.service';

enum ForecastMode {
  DAY,
  WEEK
}

@Component({
  selector: 'app-weather-widget',
  templateUrl: './weather-widget.component.html',
  styleUrls: ['./weather-widget.component.scss']
})
export class WeatherWidgetComponent {
  public city: string | null = null;

  public weather: IWeatherAPIResponse | undefined;
  public forecastResponse: IForecast[] = [];
  public cityData: ICity | undefined;

  public forecastToDisplay: IForecast[] = [];
  public forecastDays: Date[] = [];

  public forecastMode = ForecastMode.DAY;
  public selectedDayForecast: Date = new Date();

  public weatherChart:
    | ChartData<keyof ChartTypeRegistry, number[], string>
    | undefined = undefined;

  private ERROR_GETTING_WEATHER_DATA =
    'Erreur lors de la récupération des données météorologiques.';
  private ERROR_GETTING_FORECAST_DATA =
    'Erreur lors de la récupération des prévisions météorologiques.';

  constructor(
    private weatherWidgetService: WeatherWidgetService,
    private errorHandlerService: ErrorHandlerService,
    public dateUtils: DateUtilsService
  ) {}

  public refreshWidget() {
    if (this.city) {
      this.weatherWidgetService.fetchWeatherData(this.city).subscribe({
        next: (weatherData) => (this.weather = weatherData),
        error: (error) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_GETTING_WEATHER_DATA
          )
      });
      this.weatherWidgetService.fetchForecastData(this.city).subscribe({
        next: (forecastApiResponse: IForecastAPIResponse) => {
          this.forecastResponse = forecastApiResponse.list;
          this.cityData = forecastApiResponse.city;
          this.forecastDays = [
            ...new Set(
              this.forecastResponse.map((data) =>
                startOfDay(data.dt * 1000).getTime()
              )
            )
          ].map((data) => new Date(data));
          this.selectDayForecast(this.forecastDays[0]);
        },
        error: (error) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_GETTING_FORECAST_DATA
          )
      });
    }
  }

  public filterForecastByMode(
    cityData: ICity,
    forecastData: IForecast[]
  ): IForecast[] {
    switch (this.forecastMode) {
      case ForecastMode.WEEK: {
        return forecastData.filter((forecastDay) => {
          const forecastElement = this.dateUtils.formatDateFromTimestamp(
            forecastDay.dt,
            this.dateUtils.adjustTimeWithOffset(cityData.timezone)
          );
          return (
            forecastElement.getHours() >= 15 && forecastElement.getHours() <= 18
          );
        });
      }
      case ForecastMode.DAY: {
        return forecastData.filter(
          (forecastDay) =>
            new Date(forecastDay.dt * 1000).getDay() ===
              this.selectedDayForecast.getDay() &&
            new Date(forecastDay.dt * 1000).getHours() >= 7
        );
      }
    }
  }

  public getWeatherChart() {
    this.weatherChart = {
      labels: this.forecastToDisplay.map((forecastDay) => {
        if (this.forecastMode === ForecastMode.DAY) {
          return format(new Date(forecastDay.dt * 1000), 'HH');
        } else {
          return format(new Date(forecastDay.dt * 1000), 'EEE dd MMM');
        }
      }),
      datasets: [
        {
          label: 'Température',
          borderColor: 'orange',
          data: this.forecastToDisplay.map(
            (forecastDay) => forecastDay.main.tempMax
          )
        },
        {
          label: 'Ressenti',
          borderColor: 'red',
          data: this.forecastToDisplay.map(
            (forecastDay) => forecastDay.main.feelsLike
          )
        }
      ]
    };
  }

  public formatDate(date: Date): string {
    return format(date, 'dd/MM');
  }

  public isSelectedDay(date: Date): boolean {
    return (
      this.forecastMode === ForecastMode.DAY &&
      this.selectedDayForecast.getDay() === date.getDay()
    );
  }

  public isForecastModeWeek = () => this.forecastMode === ForecastMode.WEEK;

  public selectDayForecast = (date: Date) => {
    this.forecastMode = ForecastMode.DAY;
    this.selectedDayForecast = date;
    this.updateChartData();
  };

  public selectWeekForecast = () => {
    this.forecastMode = ForecastMode.WEEK;
    this.updateChartData();
  };

  private updateChartData(): void {
    if (this.cityData) {
      this.forecastToDisplay = this.filterForecastByMode(
        this.cityData,
        this.forecastResponse
      );
      this.getWeatherChart();
    }
  }

  public getWidgetData = (): { city: string } | null =>
    this.city ? { city: this.city } : null;

  public isFormValid(): boolean {
    return this.city !== null && this.city.length > 0;
  }

  public isWidgetLoaded(): boolean {
    return this.city != null && this.weather != null;
  }
}
