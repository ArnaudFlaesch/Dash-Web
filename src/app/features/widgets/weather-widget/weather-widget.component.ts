import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ErrorHandlerService } from "@core/error-handler/error-handler.service";
import { IForecastAPIResponse, IWeatherAPIResponse } from "./weather.model";
import { WeatherWidgetService } from "./weather-widget.service";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { catchError, forkJoin, of } from "rxjs";
import { WidgetComponent } from "@widgets/widget/widget.component";
import { injectWidgetData } from "@widgets/widget.tokens";
import { WeatherWidgetViewComponent } from "./weather-widget-view/weather-widget-view.component";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "@shared/utils/form-validators";

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
  public readonly labels = {
    weatherTodayIn: "La météo aujourd'hui à",
    city: "Ville",
    enterCityName: "Saisissez de nom de la ville"
  };

  public readonly config = signal({ city: injectWidgetData("city", "") });
  public readonly configForm = form(this.config, (path) => requiredText(path.city));

  /** Weather and forecast of the city saved on the last refresh, reloaded on each refresh. */
  public readonly weatherResource = rxResource({
    params: () => this.refreshedCity(),
    stream: ({ params: { city } }) =>
      forkJoin([
        this.weatherWidgetService.fetchWeatherData(city),
        this.weatherWidgetService.fetchForecastData(city)
      ]).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WEATHER_DATA);
          return of(undefined);
        })
      ),
    defaultValue: undefined as [IWeatherAPIResponse, IForecastAPIResponse] | undefined
  });

  public readonly weather = computed(() => this.weatherResource.value()?.[0]);
  public readonly forecastResponse = computed(() => this.weatherResource.value()?.[1].list ?? []);
  public readonly cityData = computed(() => this.weatherResource.value()?.[1].city);

  public readonly isWidgetLoaded = computed(
    () => !this.weatherResource.isLoading() && this.weatherResource.value() !== undefined
  );
  public readonly isFormValid = computed(() => this.configForm().valid());
  public readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));

  // A new object on each refresh, so that the resource reloads even if the city is unchanged
  private readonly refreshedCity = signal<{ city: string } | undefined>(undefined);

  private readonly ERROR_GETTING_WEATHER_DATA =
    "Erreur lors de la récupération des données météorologiques.";
  private readonly weatherWidgetService = inject(WeatherWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshedCity.set({ city: this.config().city });
    }
  }
}
