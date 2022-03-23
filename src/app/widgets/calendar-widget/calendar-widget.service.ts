import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../../app/services/authorizationBearer/authorizationBearer';
import { environment } from '../../../environments/environment';

@Injectable()
export class CalendarWidgetService {
  constructor(private http: HttpClient) {}

  public getCalendarEvents(calendarUrl: string): Observable<any> {
    return this.http.post<any>(
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
