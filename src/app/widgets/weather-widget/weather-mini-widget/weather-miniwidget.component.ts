import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ErrorHandlerService } from '../../../../app/services/error.handler.service';
import { IWeatherAPIResponse, IForecast, ICity } from '../IWeather';
import { WeatherWidgetService } from '../weather.widget.service';
import { InitialUppercasePipe } from '../../../pipes/initial.uppercase.pipe';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MiniWidgetComponent } from '../../mini-widget/mini-widget.component';

@Component({
  selector: 'dash-weather-miniwidget',
  templateUrl: './weather-miniwidget.component.html',
  styleUrls: ['./weather-miniwidget.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    MiniWidgetComponent,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatTooltip,
    MatIcon,
    InitialUppercasePipe
  ]
})
export class WeatherMiniWidgetComponent {
  private weatherWidgetService = inject(WeatherWidgetService);
  private errorHandlerService = inject(ErrorHandlerService);

  public city: string | null = null;

  public weather: IWeatherAPIResponse | undefined;
  public forecastResponse: IForecast[] = [];
  public cityData: ICity | undefined;

  public selectedDayForecast: Date = new Date();

  private ERROR_GETTING_WEATHER_DATA =
    'Erreur lors de la récupération des données météorologiques.';

  public refreshWidget(): void {
    if (this.city) {
      this.weatherWidgetService.fetchWeatherData(this.city).subscribe({
        next: (weatherData) => (this.weather = weatherData),
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WEATHER_DATA)
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
    return (this.city ?? '').length > 0;
  }

  public isWidgetLoaded(): boolean {
    return this.city != null && this.weather != null;
  }
}
