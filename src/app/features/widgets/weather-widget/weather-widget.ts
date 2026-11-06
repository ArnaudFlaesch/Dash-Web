import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { ForecastApiResponse, WeatherApiResponse } from "./weather";
import { WeatherWidgetService } from "./weather-widget-service";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { catchError, forkJoin, of } from "rxjs";
import { Widget } from "@widgets/widget/widget";
import { injectWidgetData } from "@widgets/widget-tokens";
import { WeatherWidgetView } from "./weather-widget-view/weather-widget-view";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "@shared/forms/form-validators";

@Component({
  selector: "dash-weather-widget",
  templateUrl: "./weather-widget.html",
  imports: [Widget, MatIcon, MatFormField, MatLabel, MatInput, WeatherWidgetView, FormField]
})
export class WeatherWidget {
  protected readonly labels = {
    weatherTodayIn: "La météo aujourd'hui à",
    city: "Ville",
    enterCityName: "Saisissez le nom de la ville"
  };
  private readonly ERROR_MESSAGES = {
    gettingWeatherData: "Erreur lors de la récupération des données météorologiques."
  };

  protected readonly config = signal({ city: injectWidgetData("city", "") });
  protected readonly configForm = form(this.config, (path) => requiredText(path.city));
  // A new object on each refresh, so that the resource reloads even if the city is unchanged
  private readonly refreshedCity = signal<{ city: string } | undefined>(undefined);

  /** Weather and forecast of the city saved on the last refresh, reloaded on each refresh. */
  private readonly weatherResource = rxResource({
    params: () => this.refreshedCity(),
    stream: ({ params: { city } }) =>
      forkJoin([
        this.weatherWidgetService.fetchWeatherData(city),
        this.weatherWidgetService.fetchForecastData(city)
      ]).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingWeatherData);
          return of(undefined);
        })
      ),
    defaultValue: undefined as [WeatherApiResponse, ForecastApiResponse] | undefined
  });

  protected readonly weather = computed(() => this.weatherResource.value()?.[0]);
  protected readonly forecastResponse = computed(
    () => this.weatherResource.value()?.[1].list ?? []
  );
  protected readonly cityData = computed(() => this.weatherResource.value()?.[1].city);
  protected readonly isWidgetLoaded = computed(
    () => !this.weatherResource.isLoading() && this.weatherResource.value() !== undefined
  );
  protected readonly isFormValid = computed(() => this.configForm().valid());
  protected readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));

  private readonly weatherWidgetService = inject(WeatherWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  protected refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshedCity.set({ city: this.config().city });
    }
  }
}
