import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { IIncident, IIncidentStreak } from "./IIncident";

@Service()
export class IncidentWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/incidentWidget`;

  public getIncidentConfigForWidget(widgetId: number): Observable<IIncident> {
    return this.http.get<IIncident>(`${this.baseUrl}/incidentWidgetConfig`, {
      params: { widgetId }
    });
  }

  public startFirstStreak(widgetId: number): Observable<IIncident> {
    return this.http.post<IIncident>(`${this.baseUrl}/startFirstStreak`, { widgetId });
  }

  public endStreak(widgetId: number): Observable<IIncident> {
    return this.http.post<IIncident>(`${this.baseUrl}/endStreak`, { widgetId });
  }

  public getIncidentStreaks(incidentId: number): Observable<IIncidentStreak[]> {
    return this.http.get<IIncidentStreak[]>(`${this.baseUrl}/streaks`, {
      params: { incidentId }
    });
  }
}
