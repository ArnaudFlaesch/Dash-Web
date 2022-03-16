import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../services/authorizationBearer/authorizationBearer';
import { environment } from '../../../environments/environment';
import { IActivity, IAthlete } from './IStrava';

@Injectable()
export class StravaWidgetService {
  public GET_ATHLETE_DATA_URL = 'https://www.strava.com/api/v3/athlete';
  public GET_ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities?page=1&per_page=';

  constructor(private http: HttpClient) {}

  public loginToStrava() {
    return this.http.get(
      `${environment.backend_url}/stravaWidget/login?frontendUrl=${location.origin}`,
      {
        headers: {
          Authorization: authorizationBearer()
        },
        responseType: 'text'
      }
    );
  }

  public getToken(apiCode: string): Observable<string> {
    return this.http.post<string>(
      `${environment.backend_url}/stravaWidget/getToken`,
      { apiCode: apiCode },
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public getRefreshToken(refreshToken: string): Observable<string> {
    return this.http.post<string>(
      `${environment.backend_url}/stravaWidget/getRefreshToken`,
      { refreshToken: refreshToken },
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public getAthleteData(token: string): Observable<IAthlete> {
    return this.http.get<IAthlete>(this.GET_ATHLETE_DATA_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  public getActivities(token: string, numberOfActivities: number): Observable<IActivity[]> {
    return this.http.get<IActivity[]>(this.GET_ACTIVITIES_URL + numberOfActivities.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}
