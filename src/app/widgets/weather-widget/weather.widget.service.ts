import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../../app/services/authorizationBearer/authorizationBearer';
import { environment } from './../../../environments/environment';
import { IWeather, IWeatherAPIResponse } from './IWeather';

@Injectable()
export class WeatherWidgetService {
  private WEATHER_API = 'https://api.openweathermap.org/data/2.5/';
  private WEATHER_ENDPOINT = 'weather';
  private FORECAST_ENDPOINT = 'forecast';
  private API_OPTIONS = '?units=metric&lang=fr&appid=';

  private OPENWEATHERMAP_KEY = 'd10750704319701c3f9436134add4d7d';

  constructor(private http: HttpClient) {}

  public fetchWeatherData(cityName: string): Observable<IWeather> {
    return this.http.get<IWeather>(`${environment.backend_url}/proxy/`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      },
      params: {
        url: `${this.WEATHER_API}${this.WEATHER_ENDPOINT}${this.API_OPTIONS}${this.OPENWEATHERMAP_KEY}&q=${cityName}`
      }
    });
  }

  public fetchForecastData(cityName: string): Observable<IWeatherAPIResponse> {
    return this.http.get<IWeatherAPIResponse>(`${environment.backend_url}/proxy/`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      },
      params: {
        url: `${this.WEATHER_API}${this.FORECAST_ENDPOINT}${this.API_OPTIONS}${this.OPENWEATHERMAP_KEY}&q=${cityName}`
      }
    });
  }
}
