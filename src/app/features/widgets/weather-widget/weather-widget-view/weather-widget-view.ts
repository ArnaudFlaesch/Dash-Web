import { Component, computed, input, linkedSignal, signal } from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import { MatButton } from "@angular/material/button";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { format, isSameDay, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { InitialUppercasePipe } from "@shared/text/initial-uppercase-pipe";
import { dateInTimezone } from "@shared/dates/timezone";
import { ForecastMode, City, Forecast, WeatherApiResponse } from "../weather";
import { WeatherForecast } from "../weather-forecast/weather-forecast";
import { WeatherToday } from "../weather-today/weather-today";

@Component({
  selector: "dash-weather-widget-view",
  imports: [
    InitialUppercasePipe,
    FormField,
    WeatherToday,
    MatButton,
    MatSlideToggle,
    WeatherForecast
  ],
  templateUrl: "./weather-widget-view.html",
  styleUrl: "./weather-widget-view.scss"
})
export class WeatherWidgetView {
  protected readonly labels = {
    week: "Semaine",
    displayFullForecast: "Afficher les prévisions complètes"
  };

  public readonly weather = input.required<WeatherApiResponse>();
  public readonly forecastResponse = input.required<Forecast[]>();
  public readonly cityData = input.required<City>();

  private readonly displayAllForecast = signal(false);
  public readonly displayAllForecastForm = form(this.displayAllForecast);
  /** Days of the forecasts, in the local time of the city. */
  public readonly forecastDays = computed<Date[]>(() =>
    [
      ...new Set(
        this.forecastResponse().map((forecast) =>
          startOfDay(this.toCityDate(forecast.dt)).getTime()
        )
      )
    ].map((day) => new Date(day))
  );
  public readonly forecastMode = signal(ForecastMode.DAY);
  private readonly selectedDayForecast = linkedSignal<Date>(
    () => this.forecastDays()[0] ?? new Date()
  );

  public readonly isForecastModeWeek = computed(() => this.forecastMode() === ForecastMode.WEEK);

  public readonly forecastToDisplay = computed<Forecast[]>(() =>
    this.isForecastModeWeek() ? this.getWeekForecast() : this.getDayForecast()
  );

  public formatDate(date: Date): string {
    return format(date, "eee dd", { locale: fr });
  }

  public isSelectedDay(date: Date): boolean {
    return !this.isForecastModeWeek() && isSameDay(this.selectedDayForecast(), date);
  }

  public selectDayForecast(date: Date): void {
    this.forecastMode.set(ForecastMode.DAY);
    this.selectedDayForecast.set(date);
  }

  public selectWeekForecast(): void {
    this.forecastMode.set(ForecastMode.WEEK);
  }

  /** Date of a forecast timestamp, in the local time of the city. */
  private toCityDate(timestamp: number): Date {
    return dateInTimezone(timestamp, this.cityData().timezone);
  }

  /**
   * One forecast in the afternoon of each day: the forecasts are given every 3 hours, so exactly
   * one of them starts between 15:00 included and 18:00 excluded.
   */
  private getWeekForecast(): Forecast[] {
    return this.forecastResponse().filter((forecast) => {
      const forecastHour = this.toCityDate(forecast.dt).getHours();
      return forecastHour >= 15 && forecastHour < 18;
    });
  }

  /** Next forecasts for today, the forecasts from 7:00 (or all of them) for the other days. */
  private getDayForecast(): Forecast[] {
    const selectedDay = this.selectedDayForecast();
    const today = this.toCityDate(Date.now() / 1000);
    if (isSameDay(selectedDay, today)) {
      return this.forecastResponse().slice(0, 6);
    }
    return this.forecastResponse().filter((forecast) => {
      const forecastDate = this.toCityDate(forecast.dt);
      return (
        isSameDay(forecastDate, selectedDay) &&
        (this.displayAllForecast() || forecastDate.getHours() >= 7)
      );
    });
  }
}
