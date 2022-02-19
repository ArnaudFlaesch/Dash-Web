import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ITab } from 'src/app/model/Tab';
import { environment } from '../../../environments/environment';
import authorizationBearer from '../auth.header';

@Injectable()
export class TabService {
  constructor(private http: HttpClient) {}

  public getTabs(): Observable<ITab[]> {
    return this.http.get<ITab[]>(`${environment.backend_url}/tab/`, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      }
    });
  }

  public addTab(label: string): Observable<ITab> {
    return this.http.post<ITab>(
      `${environment.backend_url}/tab/addTab`,
      { label: label },
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public updateTab(
    id: number,
    label: string,
    tabOrder: number
  ): Observable<unknown> {
    return this.http.post(
      `${environment.backend_url}/tab/updateTab`,
      { id: id, label: label, tabOrder: tabOrder },
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }

  public updateTabs(tabs: ITab[]): Observable<unknown> {
    return this.http.post(`${environment.backend_url}/tab/updateTabs`, tabs, {
      headers: {
        Authorization: authorizationBearer(),
        'Content-type': 'application/json'
      }
    });
  }

  public deleteTab(id: number): Observable<unknown> {
    return this.http.delete(
      `${environment.backend_url}/tab/deleteTab/?id=${id}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }
}
