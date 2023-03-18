import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { IMiniWidgetConfig } from '../../model/IMiniWidgetConfig';
import authorizationBearer from '../authorizationBearer/authorizationBearer';

@Injectable()
export class MiniWidgetService {
  constructor(private http: HttpClient) {}

  public getMiniWidgets(): Observable<IMiniWidgetConfig[]> {
    return this.http.get<IMiniWidgetConfig[]>(`${environment.backend_url}/miniWidget/`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      }
    });
  }

  public addMiniWidget(type: string): Observable<IMiniWidgetConfig> {
    return this.http.post<IMiniWidgetConfig>(
      `${environment.backend_url}/miniWidget/addMiniWidget`,
      { type: type },
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public updateWidgetData(id: number, data: unknown): Observable<IMiniWidgetConfig> {
    return this.http.patch<IMiniWidgetConfig>(
      `${environment.backend_url}/miniWidget/updateWidgetData/${id}`,
      { data: data },
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }
}
