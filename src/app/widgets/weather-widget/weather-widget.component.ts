import { ErrorHandlerService } from './../../services/error.handler.service';
import { Component } from '@angular/core';
import {
  ChartConfiguration,
  ChartData,
  ChartType,
  ChartTypeRegistry
} from 'chart.js';
import { format, startOfDay } from 'date-fns';
import { ICity, IForecast, IWeather, IWeatherAPIResponse } from './IWeather';
import { WeatherWidgetService } from './weather.widget.service';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';

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

  public weather: IWeather | undefined;
  public forecast: IForecast[] = [];
  public cityData: ICity | undefined;
  public forecastDays: Date[] = [];
  public weatherChart:
    | ChartData<keyof ChartTypeRegistry, number[], string>
    | undefined = undefined;
  public forecastMode = ForecastMode.DAY;
  public selectedDayForecast: Date = new Date();

  public lineChartOptions: ChartConfiguration['options'] = {
    maintainAspectRatio: false
  };

  public lineChartType: ChartType = 'line';

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
        next: (forecastApiResponse: IWeatherAPIResponse) => {
          this.forecast = forecastApiResponse.list;
          this.cityData = forecastApiResponse.city;
          this.forecastDays = [
            ...new Set(
              this.forecast.map((data) => startOfDay(data.dt * 1000).getTime())
            )
          ].map((data) => new Date(data));
          this.getWeatherChart(this.cityData);
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

  public getWeatherChart(cityData: ICity) {
    const filteredData = this.filterForecastByMode(cityData, this.forecast);
    this.weatherChart = {
      labels: filteredData.map((forecastDay) => {
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

  public getWidgetData = (): { city: string } | null =>
    this.city ? { city: this.city } : null;
  public isFormValid = (): boolean =>
    this.city !== null && this.city.length > 0;

  public getDateToDisplay = (dateTime: number, timezone: number) =>
    this.dateUtils
      .formatDateFromTimestamp(
        dateTime,
        this.dateUtils.adjustTimeWithOffset(timezone)
      )
      .toLocaleString('fr', {
        weekday: 'short',
        day: 'numeric',
        hour: '2-digit'
      });

  public getIconFromWeatherApi = (icon: string) =>
    `https://openweathermap.org/img/wn/${icon}@2x.png`;

  public formatDate(date: Date): string {
    return format(date, 'dd/MM');
  }

  public isSelectedDay = (date: Date): boolean =>
    this.forecastMode === ForecastMode.DAY &&
    this.selectedDayForecast.getDay() === date.getDay();

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
      this.getWeatherChart(this.cityData);
    }
  }

  public isWidgetLoaded = (): boolean =>
    this.city != null && this.weather != null;
}
