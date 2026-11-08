import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { ForecastApiResponse, WeatherApiResponse } from "./weather";

@Service()
export class WeatherWidgetService {
  /** Url of the image of an OpenWeatherMap icon code. */
  public getWeatherIconUrl(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/weather`;

  public fetchWeatherData(city: string): Observable<WeatherApiResponse> {
    return this.http.get<WeatherApiResponse>(`${this.baseUrl}/current`, { params: { city } });
  }

  public fetchForecastData(city: string): Observable<ForecastApiResponse> {
    return this.http.get<ForecastApiResponse>(`${this.baseUrl}/forecast`, { params: { city } });
  }
}
