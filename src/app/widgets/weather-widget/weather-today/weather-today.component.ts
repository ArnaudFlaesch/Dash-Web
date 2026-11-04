import { DecimalPipe } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { InitialUppercasePipe } from "../../../pipes/initial.uppercase.pipe";
import { dateInTimezone } from "../../../utils/date.utils";
import { IWeatherAPIResponse } from "../IWeather";
import { WeatherWidgetService } from "../weather-widget.service";

@Component({
  selector: "dash-weather-today",
  templateUrl: "./weather-today.component.html",
  styleUrl: "./weather-today.component.scss",
  imports: [MatTooltip, MatIcon, InitialUppercasePipe, DecimalPipe]
})
export class WeatherTodayComponent {
  public readonly weather = input.required<IWeatherAPIResponse>();

  public readonly sunriseTime = computed(() => this.formatTime(this.weather().sys.sunrise));
  public readonly sunsetTime = computed(() => this.formatTime(this.weather().sys.sunset));
  public readonly lastUpdateTime = computed(() => this.formatTime(this.weather().dt));

  public readonly getIconFromWeatherApi = WeatherWidgetService.getWeatherIconUrl;

  private formatTime(timestamp: number): string {
    return dateInTimezone(timestamp, this.weather().timezone).toLocaleTimeString("fr");
  }
}
