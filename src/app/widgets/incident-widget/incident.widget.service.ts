import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { environment } from "../../../environments/environment";
import authorizationBearer from "../../services/authorizationBearer/authorizationBearer";
import { IIncident, IIncidentStreak } from "./IIncident";

@Injectable()
export class IncidentWidgetService {
  private readonly http = inject(HttpClient);

  public getIncidentConfigForWidget(widgetId: number): Observable<IIncident> {
    return this.http.get<IIncident>(
      `${environment.backend_url}/incidentWidget/incidentWidgetConfig`,
      {
        headers: {
          Authorization: authorizationBearer(),
          "Content-type": "application/json"
        },
        params: {
          widgetId: widgetId
        }
      }
    );
  }

  public startFirstStreak(widgetId: number): Observable<IIncident> {
    return this.http.post<IIncident>(
      `${environment.backend_url}/incidentWidget/startFirstStreak`,
      { widgetId: widgetId },
      {
        headers: {
          Authorization: authorizationBearer(),
          "Content-type": "application/json"
        }
      }
    );
  }

  public endStreak(widgetId: number): Observable<IIncident> {
    return this.http.post<IIncident>(
      `${environment.backend_url}/incidentWidget/endStreak`,
      { widgetId: widgetId },
      {
        headers: {
          Authorization: authorizationBearer(),
          "Content-type": "application/json"
        }
      }
    );
  }

  public getIncidentStreaks(incidentId: number): Observable<IIncidentStreak[]> {
    return this.http.get<IIncidentStreak[]>(`${environment.backend_url}/incidentWidget/streaks`, {
      headers: {
        Authorization: authorizationBearer(),
        "Content-type": "application/json"
      },
      params: {
        incidentId: incidentId
      }
    });
  }
}
