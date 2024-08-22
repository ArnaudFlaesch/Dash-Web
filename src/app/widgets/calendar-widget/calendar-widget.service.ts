import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../../app/services/authorizationBearer/authorizationBearer';
import { environment } from '../../../environments/environment';
import { ICalendarData } from './ICalendarData';

@Injectable()
export class CalendarWidgetService {
  private http = inject(HttpClient);

  public getCalendarEvents(calendarUrl: string): Observable<ICalendarData[]> {
    return this.http.post<ICalendarData[]>(
      `${environment.backend_url}/calendarWidget/`,
      { calendarUrl: calendarUrl },
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }
}
