import { Component, computed, inject, signal } from "@angular/core";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { ICity, IForecast, IWeatherAPIResponse } from "./IWeather";
import { WeatherWidgetService } from "./weather.widget.service";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { forkJoin } from "rxjs";
import { WidgetComponent } from "../widget/widget.component";
import { injectWidgetData } from "../widget.tokens";
import { WeatherWidgetViewComponent } from "./weather-widget-view/weather-widget-view.component";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "../../utils/form-validators";

@Component({
  selector: "dash-weather-widget",
  templateUrl: "./weather-widget.component.html",
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
  public readonly config = signal({ city: injectWidgetData("city", "") });
  public readonly configForm = form(this.config, (path) => requiredText(path.city));

  public readonly weather = signal<IWeatherAPIResponse | undefined>(undefined);
  public readonly forecastResponse = signal<IForecast[]>([]);
  public readonly cityData = signal<ICity | undefined>(undefined);

  public readonly isWeatherLoaded = signal(false);
  public readonly isForecastLoaded = signal(false);

  public readonly isWidgetLoaded = computed(
    () => this.isWeatherLoaded() && this.isForecastLoaded()
  );
  public readonly isFormValid = computed(() => this.configForm().valid());

  private readonly ERROR_GETTING_WEATHER_DATA =
    "Erreur lors de la récupération des données météorologiques.";
  private readonly weatherWidgetService = inject(WeatherWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public refreshWidget(): void {
    const { city } = this.config();
    if (this.isFormValid()) {
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
    return this.isFormValid() ? this.config() : undefined;
  }
}
