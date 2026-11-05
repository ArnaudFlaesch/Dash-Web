import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { ICalendarData } from "./calendar-data.model";

@Service()
export class CalendarWidgetService {
  private readonly http = inject(HttpClient);

  public getCalendarEvents(calendarUrl: string): Observable<ICalendarData[]> {
    return this.http.post<ICalendarData[]>(`${environment.backend_url}/calendarWidget/`, {
      calendarUrl
    });
  }
}
