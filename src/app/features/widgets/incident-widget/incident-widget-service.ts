import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { Incident, IncidentStreak } from "./incident";

@Service()
export class IncidentWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.backend_url;

  public getIncidentConfigForWidget(widgetId: number): Observable<Incident> {
    return this.http.get<Incident>(`${this.baseUrl}/widgets/${widgetId}/incident`);
  }

  public startFirstStreak(widgetId: number): Observable<Incident> {
    return this.http.post<Incident>(`${this.baseUrl}/widgets/${widgetId}/incident`, null);
  }

  public endStreak(widgetId: number): Observable<Incident> {
    return this.http.post<Incident>(`${this.baseUrl}/widgets/${widgetId}/incident/streaks`, null);
  }

  public getIncidentStreaks(incidentId: number): Observable<IncidentStreak[]> {
    return this.http.get<IncidentStreak[]>(`${this.baseUrl}/incidents/${incidentId}/streaks`);
  }
}
