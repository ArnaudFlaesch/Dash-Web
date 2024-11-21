import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { format, isToday, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { InitialUppercasePipe } from "../../../pipes/initial.uppercase.pipe";
import { DateUtilsService } from "../../../services/date.utils.service/date.utils.service";
import { ForecastMode, ICity, IForecast, IWeatherAPIResponse } from "../IWeather";
import { WeatherForecastComponent } from "../weather-forecast/weather-forecast.component";
import { WeatherTodayComponent } from "../weather-today/weather-today.component";

@Component({
  selector: "dash-weather-widget-view",
  standalone: true,
  imports: [
    InitialUppercasePipe,
    FormsModule,
    WeatherTodayComponent,
    MatButton,
    MatSlideToggle,
    WeatherForecastComponent,
    InitialUppercasePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./weather-widget-view.component.html",
  styleUrl: "./weather-widget-view.component.scss"
})
export class WeatherWidgetViewComponent implements OnChanges {
  @Input() public weather: IWeatherAPIResponse | undefined;
  @Input() public forecastResponse: IForecast[] = [];
  @Input() public cityData: ICity | undefined;

  public displayAllForecast = false;
  public forecastToDisplay: IForecast[] = [];
  public forecastDays: Date[] = [];

  public forecastMode = ForecastMode.DAY;
  private selectedDayForecast: Date = new Date();

  private dateUtils = inject(DateUtilsService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["forecastResponse"]) {
      this.forecastDays = [
        ...new Set(
          (changes["forecastResponse"].currentValue as IForecast[]).map((data) =>
            startOfDay(data.dt * 1000).getTime()
          )
        )
      ].map((data) => new Date(data));
      this.selectDayForecast(this.forecastDays[0]);
    }
  }

  public formatDate(date: Date): string {
    return format(date, "eee dd", { locale: fr });
  }

  public isSelectedDay(date: Date): boolean {
    console.log(this.forecastMode);
    console.log(this.selectedDayForecast.getDay());
    console.log(date.getDay());
    return (
      this.forecastMode === ForecastMode.DAY && this.selectedDayForecast.getDay() === date.getDay()
    );
  }

  public isForecastModeWeek(): boolean {
    return this.forecastMode === ForecastMode.WEEK;
  }

  public selectDayForecast(date: Date): void {
    if (this.forecastMode !== ForecastMode.WEEK && this.selectedDayForecast === date) return;
    this.forecastMode = ForecastMode.DAY;
    this.selectedDayForecast = date;
    this.updateForecastData();
  }

  public selectWeekForecast(): void {
    if (this.forecastMode === ForecastMode.WEEK) return;
    this.forecastMode = ForecastMode.WEEK;
    this.updateForecastData();
  }

  public updateForecastData(): void {
    if (this.cityData) {
      this.forecastToDisplay = this.filterForecastByMode(this.cityData, this.forecastResponse);
    }
  }

  private filterForecastByMode(cityData: ICity, forecastData: IForecast[]): IForecast[] {
    switch (this.forecastMode) {
      case ForecastMode.WEEK: {
        return forecastData.filter((forecastDay) => {
          const forecastElement = this.dateUtils.formatDateFromTimestamp(
            forecastDay.dt,
            this.dateUtils.adjustTimeWithOffset(cityData.timezone)
          );
          return forecastElement.getHours() >= 15 && forecastElement.getHours() <= 18;
        });
      }
      case ForecastMode.DAY: {
        if (isToday(this.selectedDayForecast)) {
          return forecastData.slice(0, 6);
        }
        return forecastData.filter(
          (forecastDay) =>
            new Date(forecastDay.dt * 1000).getDay() === this.selectedDayForecast.getDay() &&
            (this.displayAllForecast || new Date(forecastDay.dt * 1000).getHours() >= 7)
        );
      }
    }
  }
}
