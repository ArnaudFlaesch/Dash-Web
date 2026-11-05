import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { DecimalPipe, NgOptimizedImage } from "@angular/common";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { InitialUppercasePipe } from "@shared/pipes/initial-uppercase-pipe";
import { IWeatherAPIResponse } from "../weather.model";
import { WeatherWidgetService } from "../weather-widget-service";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "@shared/utils/form-validators";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MiniWidget } from "@widgets/mini-widget/mini-widget";
import { injectWidgetData } from "@widgets/widget.tokens";
import { catchError, of } from "rxjs";

@Component({
  selector: "dash-weather-miniwidget",
  templateUrl: "./weather-miniwidget.html",
  styleUrl: "./weather-miniwidget.scss",
  imports: [
    NgOptimizedImage,
    MiniWidget,
    MatFormField,
    MatLabel,
    MatInput,
    FormField,
    MatTooltip,
    MatIcon,
    InitialUppercasePipe,
    DecimalPipe
  ]
})
export class WeatherMiniWidget {
  public readonly labels = {
    city: "Ville",
    enterCityName: "Saisissez de nom de la ville",
    currentTemperature: "Température actuelle",
    celsius: "°C"
  };

  public readonly config = signal({ city: injectWidgetData("city", "") });
  public readonly configForm = form(this.config, (path) => requiredText(path.city));

  /** Weather of the city saved on the last refresh, reloaded on each refresh. */
  public readonly weatherResource = rxResource({
    params: () => this.refreshedCity(),
    stream: ({ params: { city } }) =>
      this.weatherWidgetService.fetchWeatherData(city).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WEATHER_DATA);
          return of(null);
        })
      ),
    defaultValue: null as IWeatherAPIResponse | null
  });

  public readonly weather = this.weatherResource.value;

  public readonly isFormValid = computed(() => this.configForm().valid());
  public readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));
  public readonly isWidgetLoaded = computed(() => this.isFormValid() && this.weather() != null);

  // A new object on each refresh, so that the resource reloads even if the city is unchanged
  private readonly refreshedCity = signal<{ city: string } | undefined>(undefined);

  private readonly ERROR_GETTING_WEATHER_DATA =
    "Erreur lors de la récupération des données météorologiques.";
  private readonly weatherWidgetService = inject(WeatherWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getWeatherIconUrl(icon);
  }

  public refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshedCity.set({ city: this.config().city });
    }
  }
}
