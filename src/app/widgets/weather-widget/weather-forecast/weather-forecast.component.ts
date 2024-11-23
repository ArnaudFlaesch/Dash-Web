import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";
import { DateUtilsService } from "../../../services/date.utils.service/date.utils.service";
import { ForecastMode, IForecast } from "../IWeather";
import { WeatherWidgetService } from "../weather.widget.service";
import { InitialUppercasePipe } from "../../../pipes/initial.uppercase.pipe";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";

@Component({
  selector: "dash-weather-forecast",
  templateUrl: "./weather-forecast.component.html",
  styleUrls: ["./weather-forecast.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatTooltip, MatIcon, InitialUppercasePipe]
})
export class WeatherForecastComponent {
  private readonly weatherWidgetService = inject(WeatherWidgetService);
  private readonly dateUtils = inject(DateUtilsService);

  public readonly forecast = input.required<IForecast[]>();

  public readonly timezone = input(0);

  public readonly forecastMode = input<ForecastMode>(ForecastMode.DAY);

  public getDateToDisplay(dateTime: number, timezone: number): string {
    const options: Intl.DateTimeFormatOptions =
      this.forecastMode() === ForecastMode.DAY
        ? {
            hour: "2-digit"
          }
        : { weekday: "short", day: "numeric" };
    return this.dateUtils
      .formatDateFromTimestamp(dateTime, this.dateUtils.adjustTimeWithOffset(timezone))
      .toLocaleString("fr", options);
  }

  public getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getIconFromWeatherApi(icon);
  }
}
