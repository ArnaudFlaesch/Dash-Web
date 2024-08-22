import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MatButton } from '@angular/material/button';
import { ErrorHandlerService } from './../../services/error.handler.service';
import { ICity, IForecast, IWeatherAPIResponse } from './IWeather';
import { WeatherWidgetService } from './weather.widget.service';

import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { forkJoin } from 'rxjs';
import { WidgetComponent } from '../widget/widget.component';
import { WeatherWidgetViewComponent } from './weather-widget-view/weather-widget-view.component';

@Component({
  selector: 'dash-weather-widget',
  templateUrl: './weather-widget.component.html',
  styleUrls: ['./weather-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    WidgetComponent,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatButton,
    WeatherWidgetViewComponent
  ]
})
export class WeatherWidgetComponent {
  public city?: string;

  public weather: IWeatherAPIResponse | undefined;
  public forecastResponse: IForecast[] = [];
  public cityData: ICity | undefined;

  public isWeatherLoaded = false;
  public isForecastLoaded = false;

  private ERROR_GETTING_WEATHER_DATA =
    'Erreur lors de la récupération des données météorologiques.';

  private weatherWidgetService = inject(WeatherWidgetService);
  private errorHandlerService = inject(ErrorHandlerService);

  public refreshWidget(): void {
    if (this.city) {
      this.isWeatherLoaded = false;
      this.isForecastLoaded = false;
      forkJoin([
        this.weatherWidgetService.fetchWeatherData(this.city),
        this.weatherWidgetService.fetchForecastData(this.city)
      ]).subscribe({
        next: ([weatherData, forecastApiResponse]) => {
          this.weather = weatherData;
          this.isWeatherLoaded = true;
          this.forecastResponse = forecastApiResponse.list;
          this.cityData = forecastApiResponse.city;
          this.isForecastLoaded = true;
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WEATHER_DATA)
      });
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
}
