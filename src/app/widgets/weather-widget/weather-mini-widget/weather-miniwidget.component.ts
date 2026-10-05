import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { ErrorHandlerService } from "../../../services/error.handler.service";
import { InitialUppercasePipe } from "../../../pipes/initial.uppercase.pipe";
import { IWeatherAPIResponse } from "../IWeather";
import { WeatherWidgetService } from "../weather.widget.service";

import { FormField, form } from "@angular/forms/signals";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MiniWidgetComponent } from "../../mini-widget/mini-widget.component";

@Component({
  selector: "dash-weather-miniwidget",
  templateUrl: "./weather-miniwidget.component.html",
  styleUrls: ["./weather-miniwidget.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  public readonly city = signal<string>("");
  public readonly cityForm = form(this.city);
  public weather = signal<IWeatherAPIResponse | null>(null);

  public readonly isFormValid = computed(() => this.city().trim().length > 0);
  public readonly isWidgetLoaded = computed(() => Boolean(this.city()) && this.weather() != null);

  private readonly ERROR_GETTING_WEATHER_DATA =
    "Erreur lors de la récupération des données météorologiques.";
  private readonly weatherWidgetService = inject(WeatherWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public refreshWidget(): void {
    const city = this.city();
    if (city) {
      this.weatherWidgetService.fetchWeatherData(city).subscribe({
        next: (weatherData) => this.weather.set(weatherData),
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_WEATHER_DATA)
      });
    }
  }

  public getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getIconFromWeatherApi(icon);
  }

  public getWidgetData(): { city: string } | undefined {
    const city = this.city();
    return city ? { city } : undefined;
  }
}
