import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { Activity, Athlete, TokenData } from "./strava";

@Service()
export class StravaWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/stravaWidget`;

  public getToken(apiCode: string): Observable<TokenData> {
    return this.http.post<TokenData>(`${this.baseUrl}/getToken`, { apiCode });
  }

  public getRefreshToken(refreshToken: string): Observable<TokenData> {
    return this.http.post<TokenData>(`${this.baseUrl}/getRefreshToken`, { refreshToken });
  }

  public getAthleteData(token: string): Observable<Athlete> {
    return this.http.get<Athlete>(`${this.baseUrl}/getAthleteData`, { params: { token } });
  }

  public getActivities(
    token: string,
    pageNumber: number,
    numberOfActivities: number
  ): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.baseUrl}/getAthleteActivities`, {
      params: { token, pageNumber, numberOfActivities }
    });
  }
}
