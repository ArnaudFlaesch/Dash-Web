import { Component, Input } from '@angular/core';
import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { ForecastMode, IForecast } from '../IWeather';
import { WeatherWidgetService } from '../weather.widget.service';

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

  @Input()
  public forecastMode: ForecastMode = ForecastMode.DAY

  constructor(
    private weatherWidgetService: WeatherWidgetService,
    private dateUtils: DateUtilsService
  ) {}

  public getDateToDisplay(dateTime: number, timezone: number): string {
    const options: Intl.DateTimeFormatOptions = (this.forecastMode === ForecastMode.DAY) ? {
      hour: '2-digit'
    } : {weekday: 'short',
    day: 'numeric'} 
    return this.dateUtils
      .formatDateFromTimestamp(
        dateTime,
        this.dateUtils.adjustTimeWithOffset(timezone)
      )
      .toLocaleString('fr', options);
  }

  public getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getIconFromWeatherApi(icon);
  }
}
