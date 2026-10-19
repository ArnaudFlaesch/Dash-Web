import { Component, computed, inject, input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { InitialUppercasePipe } from "../../../pipes/initial.uppercase.pipe";
import { DateUtilsService } from "../../../services/date.utils.service/date.utils.service";
import { IWeatherAPIResponse } from "../IWeather";
import { WeatherWidgetService } from "../weather.widget.service";

@Component({
  selector: "dash-weather-today",
  templateUrl: "./weather-today.component.html",
  styleUrl: "./weather-today.component.scss",
  imports: [MatTooltip, MatIcon, InitialUppercasePipe]
})
export class WeatherTodayComponent {
  public readonly weather = input.required<IWeatherAPIResponse>();

  public readonly sunriseTime = computed(() => this.formatTime(this.weather().sys.sunrise));
  public readonly sunsetTime = computed(() => this.formatTime(this.weather().sys.sunset));
  public readonly lastUpdateTime = computed(() => this.formatTime(this.weather().dt));

  private readonly dateUtils = inject(DateUtilsService);
  private readonly weatherWidgetService = inject(WeatherWidgetService);

  public getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getIconFromWeatherApi(icon);
  }

  private formatTime(timestamp: number): string {
    return this.dateUtils
      .formatDateFromTimestamp(
        timestamp,
        this.dateUtils.adjustTimeWithOffset(this.weather().timezone)
      )
      .toLocaleTimeString("fr");
  }
}
