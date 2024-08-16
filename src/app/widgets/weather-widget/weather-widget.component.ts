import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { format, isToday, startOfDay } from 'date-fns';

import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { ErrorHandlerService } from './../../services/error.handler.service';
import {
  ForecastMode,
  ICity,
  IForecast,
  IForecastAPIResponse,
  IWeatherAPIResponse
} from './IWeather';
import { WeatherWidgetService } from './weather.widget.service';
import { fr } from 'date-fns/locale';
import { InitialUppercasePipe } from '../../pipes/initial.uppercase.pipe';
import { WeatherForecastComponent } from './weather-forecast/weather-forecast.component';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButton } from '@angular/material/button';
import { WeatherTodayComponent } from './weather-today/weather-today.component';

import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { WidgetComponent } from '../widget/widget.component';

@Component({
  selector: 'dash-weather-widget',
  templateUrl: './weather-widget.component.html',
  styleUrls: ['./weather-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WidgetComponent,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    WeatherTodayComponent,
    MatButton,
    MatSlideToggle,
    WeatherForecastComponent,
    InitialUppercasePipe
  ]
})
export class WeatherWidgetComponent {
  public city?: string;
  public displayAllForecast = false;

  public weather: IWeatherAPIResponse | undefined;
  public forecastResponse: IForecast[] = [];
  public cityData: ICity | undefined;

  public forecastToDisplay: IForecast[] = [];
  public forecastDays: Date[] = [];

  public forecastMode = ForecastMode.DAY;
  public selectedDayForecast: Date = new Date();
  public isWeatherLoaded = false;
  public isForecastLoaded = false;

  private weatherWidgetService = inject(WeatherWidgetService);
  private errorHandlerService = inject(ErrorHandlerService);
  private dateUtils = inject(DateUtilsService);

  private ERROR_GETTING_WEATHER_DATA =
    'Erreur lors de la récupération des données météorologiques.';
  private ERROR_GETTING_FORECAST_DATA =
    'Erreur lors de la récupération des prévisions météorologiques.';

  public refreshWidget(): void {
    if (this.city) {
      this.isWeatherLoaded = false;
      this.isForecastLoaded = false;
      this.weatherWidgetService.fetchWeatherData(this.city).subscribe({
        next: (weatherData) => {
          this.weather = weatherData;
          this.isWeatherLoaded = true;
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WEATHER_DATA)
      });
      this.weatherWidgetService.fetchForecastData(this.city).subscribe({
        next: (forecastApiResponse: IForecastAPIResponse) => {
          this.forecastResponse = forecastApiResponse.list;
          this.cityData = forecastApiResponse.city;
          this.forecastDays = [
            ...new Set(this.forecastResponse.map((data) => startOfDay(data.dt * 1000).getTime()))
          ].map((data) => new Date(data));
          this.selectDayForecast(this.forecastDays[0]);
          this.isForecastLoaded = true;
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_FORECAST_DATA)
      });
    }
  }

  public formatDate(date: Date): string {
    return format(date, 'eee dd', { locale: fr });
  }

  public isSelectedDay(date: Date): boolean {
    return (
      this.forecastMode === ForecastMode.DAY && this.selectedDayForecast.getDay() === date.getDay()
    );
  }

  public isForecastModeWeek(): boolean {
    return this.forecastMode === ForecastMode.WEEK;
  }

  public selectDayForecast(date: Date): void {
    if (this.forecastMode !== ForecastMode.WEEK && this.selectedDayForecast === date) return;
    this.forecastMode = ForecastMode.DAY;
    this.selectedDayForecast = date;
    this.updateForecastData();
  }

  public selectWeekForecast(): void {
    if (this.forecastMode === ForecastMode.WEEK) return;
    this.forecastMode = ForecastMode.WEEK;
    this.updateForecastData();
  }

  public updateForecastData(): void {
    if (this.cityData) {
      this.forecastToDisplay = this.filterForecastByMode(this.cityData, this.forecastResponse);
    }
  }

  public isWidgetLoaded(): boolean {
    return this.isWeatherLoaded && this.isForecastLoaded;
  }

  public getWidgetData(): { city: string } | undefined {
    return this.city ? { city: this.city } : undefined;
  }

  public isFormValid(): boolean {
    return (this.city ?? '').length > 0;
  }

  private filterForecastByMode(cityData: ICity, forecastData: IForecast[]): IForecast[] {
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
      case ForecastMode.DAY: {
        if (isToday(this.selectedDayForecast)) {
          return forecastData.slice(0, 6);
        }
        return forecastData.filter(
          (forecastDay) =>
            new Date(forecastDay.dt * 1000).getDay() === this.selectedDayForecast.getDay() &&
            (this.displayAllForecast || new Date(forecastDay.dt * 1000).getHours() >= 7)
        );
      }
    }
  }
}
