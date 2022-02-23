import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import authorizationBearer from '../authorizationBearer/authorizationBearer';
import { IWidgetConfig } from './../../model/IWidgetConfig';

@Injectable()
export class WidgetService {
  constructor(private http: HttpClient) {}

  public getWidgets(tabId: number): Observable<IWidgetConfig[]> {
    return this.http.get<IWidgetConfig[]>(`${environment.backend_url}/widget/?tabId=${tabId}`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      }
    });
  }

  public addWidget(type: string, tabId: number): Observable<IWidgetConfig> {
    return this.http.post<IWidgetConfig>(
      `${environment.backend_url}/widget/addWidget`,
      { type: type, tab: { id: tabId } },
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public updateWidgetData(id: number, data: unknown): Observable<IWidgetConfig> {
    return this.http.patch<IWidgetConfig>(
      `${environment.backend_url}/widget/updateWidgetData/${id}`,
      { data: data },
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public deleteWidget(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${environment.backend_url}/widget/deleteWidget/?id=${id}`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      }
    });
  }
}
