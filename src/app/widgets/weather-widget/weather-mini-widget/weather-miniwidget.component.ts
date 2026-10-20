import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { catchError, of } from "rxjs";
import { ErrorHandlerService } from "../../../services/error.handler.service";
import { InitialUppercasePipe } from "../../../pipes/initial.uppercase.pipe";
import { IWeatherAPIResponse } from "../IWeather";
import { WeatherWidgetService } from "../weather.widget.service";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "../../../utils/form-validators";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MiniWidgetComponent } from "../../mini-widget/mini-widget.component";
import { injectWidgetData } from "../../widget.tokens";

@Component({
  selector: "dash-weather-miniwidget",
  templateUrl: "./weather-miniwidget.component.html",
  styleUrl: "./weather-miniwidget.component.scss",
  imports: [
    MiniWidgetComponent,
    MatFormField,
    MatLabel,
    MatInput,
    FormField,
    MatTooltip,
    MatIcon,
    InitialUppercasePipe
  ]
})
export class WeatherMiniWidgetComponent {
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
  public readonly isWidgetLoaded = computed(() => this.isFormValid() && this.weather() != null);

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

  public getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getIconFromWeatherApi(icon);
  }

  public getWidgetData(): { city: string } | undefined {
    return this.isFormValid() ? this.config() : undefined;
  }
}
