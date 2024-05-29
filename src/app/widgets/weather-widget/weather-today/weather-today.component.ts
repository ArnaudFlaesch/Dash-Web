import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { IWeatherAPIResponse } from '../IWeather';
import { WeatherWidgetService } from '../weather.widget.service';
import { InitialUppercasePipe } from '../../../pipes/initial.uppercase.pipe';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'dash-weather-today',
  templateUrl: './weather-today.component.html',
  styleUrls: ['./weather-today.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatTooltip, MatIcon, InitialUppercasePipe]
})
export class WeatherTodayComponent {
  @Input()
  public weather: IWeatherAPIResponse | undefined;

  constructor(
    private weatherWidgetService: WeatherWidgetService,
    public dateUtils: DateUtilsService
  ) {}

  public getIconFromWeatherApi(icon: string): string {
    return this.weatherWidgetService.getIconFromWeatherApi(icon);
  }
}
