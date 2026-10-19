import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { IForecastAPIResponse, IWeatherAPIResponse } from "./IWeather";

@Service()
export class WeatherWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/weatherWidget`;

  public fetchWeatherData(city: string): Observable<IWeatherAPIResponse> {
    return this.http.get<IWeatherAPIResponse>(`${this.baseUrl}/weather`, { params: { city } });
  }

  public fetchForecastData(city: string): Observable<IForecastAPIResponse> {
    return this.http.get<IForecastAPIResponse>(`${this.baseUrl}/forecast`, { params: { city } });
  }

  public getIconFromWeatherApi(icon: string): string {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }
}
