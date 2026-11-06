import { DecimalPipe, NgOptimizedImage } from "@angular/common";
import { Component, inject, computed, input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { InitialUppercasePipe } from "@shared/text/initial-uppercase-pipe";
import { dateInTimezone } from "@shared/dates/timezone";
import { WeatherApiResponse } from "../weather";
import { WeatherWidgetService } from "../weather-widget-service";

@Component({
  selector: "dash-weather-today",
  templateUrl: "./weather-today.html",
  styleUrl: "./weather-today.scss",
  imports: [NgOptimizedImage, MatTooltip, MatIcon, InitialUppercasePipe, DecimalPipe]
})
export class WeatherToday {
  protected readonly labels = {
    currentTemperature: "Température actuelle",
    celsius: "°C",
    sunrise: "Lever du soleil",
    sunset: "Coucher du soleil",
    lastUpdate: "Dernière mise à jour à"
  };

  public readonly weather = input.required<WeatherApiResponse>();

  protected readonly sunriseTime = computed(() => this.formatTime(this.weather().sys.sunrise));
  protected readonly sunsetTime = computed(() => this.formatTime(this.weather().sys.sunset));
  protected readonly lastUpdateTime = computed(() => this.formatTime(this.weather().dt));

  private readonly weatherWidgetService = inject(WeatherWidgetService);

  protected getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getWeatherIconUrl(icon);
  }

  private formatTime(timestamp: number): string {
    return dateInTimezone(timestamp, this.weather().timezone).toLocaleTimeString("fr");
  }
}
