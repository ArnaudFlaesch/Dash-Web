import { Component } from '@angular/core';
import { ErrorHandlerService } from '../../../../app/services/error.handler.service';
import { IWeatherAPIResponse, IForecast, ICity } from '../IWeather';
import { WeatherWidgetService } from '../weather.widget.service';

@Component({
  selector: 'app-weather-miniwidget',
  templateUrl: './weather-miniwidget.component.html',
  styleUrls: ['./weather-miniwidget.component.scss']
})
export class WeatherMiniWidgetComponent {
  public city: string | null = null;

  public weather: IWeatherAPIResponse | undefined;
  public forecastResponse: IForecast[] = [];
  public cityData: ICity | undefined;

  public selectedDayForecast: Date = new Date();

  private ERROR_GETTING_WEATHER_DATA =
    'Erreur lors de la récupération des données météorologiques.';

  constructor(
    private weatherWidgetService: WeatherWidgetService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  public refreshWidget(): void {
    if (this.city) {
      this.weatherWidgetService.fetchWeatherData(this.city).subscribe({
        next: (weatherData) => (this.weather = weatherData),
        error: (error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_WEATHER_DATA)
      });
    }
  }
  public getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getIconFromWeatherApi(icon);
  }

  public getWidgetData(): { city: string } | undefined {
    return this.city ? { city: this.city } : undefined;
  }

  public isFormValid(): boolean {
    return this.city !== null && this.city.length > 0;
  }

  public isWidgetLoaded(): boolean {
    return this.city != null && this.weather != null;
  }
}
