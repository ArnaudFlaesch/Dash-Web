import { DecimalPipe, NgOptimizedImage } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { InitialUppercasePipe } from "@shared/text/initial-uppercase-pipe";
import { dateInTimezone } from "@shared/dates/timezone";
import { WeatherApiResponse, getWeatherIconUrl } from "../weather";

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

  public readonly sunriseTime = computed(() => this.formatTime(this.weather().sys.sunrise));
  public readonly sunsetTime = computed(() => this.formatTime(this.weather().sys.sunset));
  public readonly lastUpdateTime = computed(() => this.formatTime(this.weather().dt));

  public getIconFromWeatherApi(icon: string): string {
    return getWeatherIconUrl(icon);
  }

  private formatTime(timestamp: number): string {
    return dateInTimezone(timestamp, this.weather().timezone).toLocaleTimeString("fr");
  }
}
