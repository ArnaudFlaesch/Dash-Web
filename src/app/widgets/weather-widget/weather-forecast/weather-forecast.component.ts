import { DecimalPipe, NgOptimizedImage } from "@angular/common";
import { Component, inject, input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { InitialUppercasePipe } from "@pipes/initial.uppercase.pipe";
import { dateInTimezone } from "@utils/date.utils";
import { ForecastMode, IForecast } from "../IWeather";
import { WeatherWidgetService } from "../weather-widget.service";

@Component({
  selector: "dash-weather-forecast",
  templateUrl: "./weather-forecast.component.html",
  styleUrl: "./weather-forecast.component.scss",
  imports: [NgOptimizedImage, MatTooltip, MatIcon, InitialUppercasePipe, DecimalPipe]
})
export class WeatherForecastComponent {
  public readonly labels = {
    maxTemperature: "Température maximum",
    celsius: "°C",
    minTemperature: "Température minimum",
    humidity: "Humidité",
    percent: "%"
  };

  public readonly forecast = input.required<IForecast[]>();
  public readonly timezone = input(0);
  public readonly forecastMode = input<ForecastMode>(ForecastMode.DAY);

  private readonly weatherWidgetService = inject(WeatherWidgetService);

  public getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getWeatherIconUrl(icon);
  }

  public getDateToDisplay(dateTime: number, timezone: number): string {
    const options: Intl.DateTimeFormatOptions =
      this.forecastMode() === ForecastMode.DAY
        ? { hour: "2-digit" }
        : { weekday: "short", day: "numeric" };
    return dateInTimezone(dateTime, timezone).toLocaleString("fr", options);
  }
}
