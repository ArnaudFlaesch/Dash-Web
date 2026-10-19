import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { IActivity, IAthlete, ITokenData } from "./IStrava";

@Service()
export class StravaWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/stravaWidget`;

  public getToken(apiCode: string): Observable<ITokenData> {
    return this.http.post<ITokenData>(`${this.baseUrl}/getToken`, { apiCode });
  }

  public getRefreshToken(refreshToken: string): Observable<ITokenData> {
    return this.http.post<ITokenData>(`${this.baseUrl}/getRefreshToken`, { refreshToken });
  }

  public getAthleteData(token: string): Observable<IAthlete> {
    return this.http.get<IAthlete>(`${this.baseUrl}/getAthleteData?token=${token}`);
  }

  public getActivities(
    token: string,
    pageNumber?: number,
    numberOfActivities?: number
  ): Observable<IActivity[]> {
    return this.http.get<IActivity[]>(
      `${this.baseUrl}/getAthleteActivities?token=${token}&pageNumber=${pageNumber}&numberOfActivities=${numberOfActivities}`
    );
  }
}
