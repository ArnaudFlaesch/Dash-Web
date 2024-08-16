import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import authorizationBearer from '../authorizationBearer/authorizationBearer';
import { IWidgetConfig } from './../../model/IWidgetConfig';

@Injectable()
export class WidgetService {
  private http = inject(HttpClient);

  public _widgetDeletedEvent: ReplaySubject<number> = new ReplaySubject(0);
  public _refreshWidgetsAction: ReplaySubject<unknown> = new ReplaySubject(0);
  public readonly widgetDeleted: Observable<number> = this._widgetDeletedEvent.asObservable();
  public readonly refreshWidgetsAction: Observable<unknown> =
    this._refreshWidgetsAction.asObservable();

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
      { type: type, tabId: tabId },
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

  public updateWidgetsOrder(widgetsData: IWidgetConfig[]): Observable<IWidgetConfig[]> {
    return this.http.post<IWidgetConfig[]>(
      `${environment.backend_url}/widget/updateWidgetsOrder`,
      widgetsData,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public deleteWidget(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.backend_url}/widget/deleteWidget?id=${id}`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      }
    });
  }
}
