import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../services/authorizationBearer/authorizationBearer';
import { environment } from '../../../environments/environment';
import { IActivity, IAthlete, ITokenData } from './IStrava';

@Injectable()
export class StravaWidgetService {
  constructor(private http: HttpClient) {}

  public getToken(apiCode: string): Observable<ITokenData> {
    return this.http.post<ITokenData>(
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

  public getRefreshToken(refreshToken: string): Observable<ITokenData> {
    return this.http.post<ITokenData>(
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
    return this.http.get<IAthlete>(
      `${environment.backend_url}/stravaWidget/getAthleteData?token=${token}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public getActivities(token: string, numberOfActivities?: number): Observable<IActivity[]> {
    return this.http.get<IActivity[]>(
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${token}&numberOfActivities=${numberOfActivities}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }
}
