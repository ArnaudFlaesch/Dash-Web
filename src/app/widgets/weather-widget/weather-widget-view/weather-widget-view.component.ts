import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal
} from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
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
  imports: [
    InitialUppercasePipe,
    FormField,
    WeatherTodayComponent,
    MatButton,
    MatSlideToggle,
    WeatherForecastComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./weather-widget-view.component.html",
  styleUrl: "./weather-widget-view.component.scss"
})
export class WeatherWidgetViewComponent {
  public readonly weather = input.required<IWeatherAPIResponse>();
  public readonly forecastResponse = input.required<IForecast[]>();
  public readonly cityData = input.required<ICity>();

  public readonly displayAllForecast = signal(false);
  public readonly displayAllForecastForm = form(this.displayAllForecast);
  public readonly forecastDays = computed<Date[]>(() =>
    [...new Set(this.forecastResponse().map((data) => startOfDay(data.dt * 1000).getTime()))].map(
      (data) => new Date(data)
    )
  );
  public readonly forecastMode = signal(ForecastMode.DAY);
  public readonly selectedDayForecast = linkedSignal<Date>(
    () => this.forecastDays()[0] ?? new Date()
  );

  public readonly isForecastModeWeek = computed(() => this.forecastMode() === ForecastMode.WEEK);

  public readonly forecastToDisplay = computed<IForecast[]>(() => {
    const cityData = this.cityData();
    const forecastData = this.forecastResponse();
    if (!cityData || !forecastData) return [];
    return this.filterForecastByMode(cityData, forecastData);
  });

  private readonly dateUtils = inject(DateUtilsService);

  public formatDate(date: Date): string {
    return format(date, "eee dd", { locale: fr });
  }

  public isSelectedDay(date: Date): boolean {
    return (
      this.forecastMode() === ForecastMode.DAY &&
      this.selectedDayForecast().getDay() === date.getDay()
    );
  }

  public selectDayForecast(date: Date): void {
    if (this.forecastMode() !== ForecastMode.WEEK && this.selectedDayForecast() === date) return;
    this.forecastMode.set(ForecastMode.DAY);
    this.selectedDayForecast.set(date);
  }

  public selectWeekForecast(): void {
    if (this.forecastMode() === ForecastMode.WEEK) return;
    this.forecastMode.set(ForecastMode.WEEK);
  }

  private filterForecastByMode(cityData: ICity, forecastData: IForecast[]): IForecast[] {
    switch (this.forecastMode()) {
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
        if (isToday(this.selectedDayForecast())) {
          return forecastData.slice(0, 6);
        }
        return forecastData.filter(
          (forecastDay) =>
            new Date(forecastDay.dt * 1000).getDay() === this.selectedDayForecast().getDay() &&
            (this.displayAllForecast() || new Date(forecastDay.dt * 1000).getHours() >= 7)
        );
      }
    }
  }
}
