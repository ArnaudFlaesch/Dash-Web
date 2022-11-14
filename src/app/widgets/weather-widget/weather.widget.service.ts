import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../../app/services/authorizationBearer/authorizationBearer';
import { environment } from './../../../environments/environment';
import { IForecastAPIResponse, IWeatherAPIResponse } from './IWeather';

@Injectable()
export class WeatherWidgetService {
  constructor(private http: HttpClient) {}

  public fetchWeatherData(cityName: string): Observable<IWeatherAPIResponse> {
    return this.http.get<IWeatherAPIResponse>(
      `${environment.backend_url}/weatherWidget/weather`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        },
        params: {
          city: cityName
        }
      }
    );
  }

  public fetchForecastData(cityName: string): Observable<IForecastAPIResponse> {
    return this.http.get<IForecastAPIResponse>(
      `${environment.backend_url}/weatherWidget/forecast`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        },
        params: {
          city: cityName
        }
      }
    );
  }

  public getIconFromWeatherApi(icon: string) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }
}
