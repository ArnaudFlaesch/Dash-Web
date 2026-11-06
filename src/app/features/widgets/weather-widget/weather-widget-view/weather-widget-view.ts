import { Component, computed, input, linkedSignal, signal } from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import { MatButton } from "@angular/material/button";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { format, isToday, startOfDay } from "date-fns";
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
  protected readonly displayAllForecastForm = form(this.displayAllForecast);
  protected readonly forecastDays = computed<Date[]>(() =>
    [...new Set(this.forecastResponse().map((data) => startOfDay(data.dt * 1000).getTime()))].map(
      (data) => new Date(data)
    )
  );
  protected readonly forecastMode = signal(ForecastMode.DAY);
  private readonly selectedDayForecast = linkedSignal<Date>(
    () => this.forecastDays()[0] ?? new Date()
  );

  protected readonly isForecastModeWeek = computed(() => this.forecastMode() === ForecastMode.WEEK);

  protected readonly forecastToDisplay = computed<Forecast[]>(() => {
    return this.filterForecastByMode(this.cityData(), this.forecastResponse());
  });

  protected formatDate(date: Date): string {
    return format(date, "eee dd", { locale: fr });
  }

  protected isSelectedDay(date: Date): boolean {
    return (
      this.forecastMode() === ForecastMode.DAY &&
      this.selectedDayForecast().getDay() === date.getDay()
    );
  }

  protected selectDayForecast(date: Date): void {
    if (this.forecastMode() !== ForecastMode.WEEK && this.selectedDayForecast() === date) return;
    this.forecastMode.set(ForecastMode.DAY);
    this.selectedDayForecast.set(date);
  }

  protected selectWeekForecast(): void {
    if (this.forecastMode() === ForecastMode.WEEK) return;
    this.forecastMode.set(ForecastMode.WEEK);
  }

  private filterForecastByMode(cityData: City, forecastData: Forecast[]): Forecast[] {
    switch (this.forecastMode()) {
      case ForecastMode.WEEK: {
        return forecastData.filter((forecastDay) => {
          const forecastHour = dateInTimezone(forecastDay.dt, cityData.timezone).getHours();
          return forecastHour >= 15 && forecastHour <= 18;
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
