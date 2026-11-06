import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { DecimalPipe, NgOptimizedImage } from "@angular/common";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { InitialUppercasePipe } from "@shared/text/initial-uppercase-pipe";
import { WeatherApiResponse } from "../weather";
import { WeatherWidgetService } from "../weather-widget-service";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "@shared/forms/form-validators";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MiniWidget } from "@widgets/mini-widget/mini-widget";
import { injectWidgetData } from "@widgets/widget-tokens";
import { catchError, of } from "rxjs";

@Component({
  selector: "dash-weather-mini-widget",
  templateUrl: "./weather-mini-widget.html",
  styleUrl: "./weather-mini-widget.scss",
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
  protected readonly labels = {
    city: "Ville",
    enterCityName: "Saisissez le nom de la ville",
    currentTemperature: "Température actuelle",
    celsius: "°C"
  };
  private readonly ERROR_MESSAGES = {
    gettingWeatherData: "Erreur lors de la récupération des données météorologiques."
  };

  protected readonly config = signal({ city: injectWidgetData("city", "") });
  protected readonly configForm = form(this.config, (path) => requiredText(path.city));
  // A new object on each refresh, so that the resource reloads even if the city is unchanged
  private readonly refreshedCity = signal<{ city: string } | undefined>(undefined);

  /** Weather of the city saved on the last refresh, reloaded on each refresh. */
  private readonly weatherResource = rxResource({
    params: () => this.refreshedCity(),
    stream: ({ params: { city } }) =>
      this.weatherWidgetService.fetchWeatherData(city).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingWeatherData);
          return of(null);
        })
      ),
    defaultValue: null as WeatherApiResponse | null
  });

  protected readonly weather = this.weatherResource.value;
  protected readonly isFormValid = computed(() => this.configForm().valid());
  protected readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));
  protected readonly isWidgetLoaded = computed(() => this.isFormValid() && this.weather() != null);

  private readonly weatherWidgetService = inject(WeatherWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  protected getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getWeatherIconUrl(icon);
  }

  protected refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshedCity.set({ city: this.config().city });
    }
  }
}
