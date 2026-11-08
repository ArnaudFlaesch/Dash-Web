import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { CalendarData } from "./calendar-data";

@Service()
export class CalendarWidgetService {
  private readonly http = inject(HttpClient);

  public getCalendarEvents(calendarUrl: string): Observable<CalendarData[]> {
    return this.http.post<CalendarData[]>(`${environment.backend_url}/calendar/events`, {
      calendarUrl
    });
  }
}
