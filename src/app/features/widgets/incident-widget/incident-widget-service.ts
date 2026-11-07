import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { Incident, IncidentStreak } from "./incident";

@Service()
export class IncidentWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/incidentWidget`;

  public getIncidentConfigForWidget(widgetId: number): Observable<Incident> {
    return this.http.get<Incident>(`${this.baseUrl}/incidentWidgetConfig`, {
      params: { widgetId }
    });
  }

  public startFirstStreak(widgetId: number): Observable<Incident> {
    return this.http.post<Incident>(`${this.baseUrl}/startFirstStreak`, { widgetId });
  }

  public endStreak(widgetId: number): Observable<Incident> {
    return this.http.post<Incident>(`${this.baseUrl}/endStreak`, { widgetId });
  }

  public getIncidentStreaks(incidentId: number): Observable<IncidentStreak[]> {
    return this.http.get<IncidentStreak[]>(`${this.baseUrl}/streaks`, {
      params: { incidentId }
    });
  }
}
