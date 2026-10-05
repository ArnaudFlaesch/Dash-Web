import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  WritableSignal
} from "@angular/core";

import { ErrorHandlerService } from "../../services/error.handler.service";
import { ICity, IForecast, IWeatherAPIResponse } from "./IWeather";
import { WeatherWidgetService } from "./weather.widget.service";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { forkJoin } from "rxjs";
import { WidgetComponent } from "../widget/widget.component";
import { WeatherWidgetViewComponent } from "./weather-widget-view/weather-widget-view.component";
import { FormField, form } from "@angular/forms/signals";

@Component({
  selector: "dash-weather-widget",
  templateUrl: "./weather-widget.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WidgetComponent,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    WeatherWidgetViewComponent,
    FormField
  ]
})
export class WeatherWidgetComponent {
  public readonly city = signal<string>("");
  public readonly cityForm = form(this.city);

  public weather = signal<IWeatherAPIResponse | undefined>(undefined);
  public forecastResponse: WritableSignal<IForecast[]> = signal([]);
  public cityData = signal<ICity | undefined>(undefined);

  public readonly isWeatherLoaded = signal(false);
  public readonly isForecastLoaded = signal(false);

  public readonly isWidgetLoaded = computed(
    () => this.isWeatherLoaded() && this.isForecastLoaded()
  );
  public readonly isFormValid = computed(() => this.city().trim().length > 0);

  private readonly ERROR_GETTING_WEATHER_DATA =
    "Erreur lors de la récupération des données météorologiques.";
  private readonly weatherWidgetService = inject(WeatherWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public refreshWidget(): void {
    const city = this.city();
    if (city) {
      this.isWeatherLoaded.set(false);
      this.isForecastLoaded.set(false);
      forkJoin([
        this.weatherWidgetService.fetchWeatherData(city),
        this.weatherWidgetService.fetchForecastData(city)
      ]).subscribe({
        next: ([weatherData, forecastApiResponse]) => {
          this.weather.set(weatherData);
          this.isWeatherLoaded.set(true);
          this.forecastResponse.set(forecastApiResponse.list);
          this.cityData.set(forecastApiResponse.city);
          this.isForecastLoaded.set(true);
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WEATHER_DATA)
      });
    }
  }

  public getWidgetData(): { city: string } | undefined {
    const city = this.city();
    return city ? { city } : undefined;
  }
}
