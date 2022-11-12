import { Component, Input } from '@angular/core';
import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { IForecast } from '../IWeather';

@Component({
  selector: 'app-weather-forecast',
  templateUrl: './weather-forecast.component.html',
  styleUrls: ['./weather-forecast.component.scss']
})
export class WeatherForecastComponent {
  @Input()
  public forecast: IForecast[] = [];

  @Input()
  public timezone = 0;

  constructor(private dateUtils: DateUtilsService) {}

  public getDateToDisplay = (dateTime: number, timezone: number) =>
    this.dateUtils
      .formatDateFromTimestamp(
        dateTime,
        this.dateUtils.adjustTimeWithOffset(timezone)
      )
      .toLocaleString('fr', {
        weekday: 'short',
        day: 'numeric',
        hour: '2-digit'
      });

  public getIconFromWeatherApi(icon: string) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }
}
