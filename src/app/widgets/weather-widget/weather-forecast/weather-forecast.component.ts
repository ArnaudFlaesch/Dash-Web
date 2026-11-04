import { DecimalPipe } from "@angular/common";
import { Component, input } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { InitialUppercasePipe } from "../../../pipes/initial.uppercase.pipe";
import { dateInTimezone } from "../../../utils/date.utils";
import { ForecastMode, IForecast } from "../IWeather";
import { WeatherWidgetService } from "../weather-widget.service";

@Component({
  selector: "dash-weather-forecast",
  templateUrl: "./weather-forecast.component.html",
  styleUrl: "./weather-forecast.component.scss",
  imports: [MatTooltip, MatIcon, InitialUppercasePipe, DecimalPipe]
})
export class WeatherForecastComponent {
  public readonly forecast = input.required<IForecast[]>();
  public readonly timezone = input(0);
  public readonly forecastMode = input<ForecastMode>(ForecastMode.DAY);

  public readonly getIconFromWeatherApi = WeatherWidgetService.getWeatherIconUrl;

  public getDateToDisplay(dateTime: number, timezone: number): string {
    const options: Intl.DateTimeFormatOptions =
      this.forecastMode() === ForecastMode.DAY
        ? { hour: "2-digit" }
        : { weekday: "short", day: "numeric" };
    return dateInTimezone(dateTime, timezone).toLocaleString("fr", options);
  }
}
