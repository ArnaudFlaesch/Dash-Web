import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../services/authorizationBearer/authorizationBearer';
import { environment } from '../../../environments/environment';

@Injectable()
export class AirParifWidgetService {
  constructor(private http: HttpClient) {}
  private airparifToken = '1dfea964-b7ab-a47c-3602-ee56d6603217';

  public getCommunePrevision(communeInseeCode: string): Observable<any> {
    return this.http.get<any>(
      `${environment.backend_url}/airParifWidget/previsionCommune?commune=${communeInseeCode}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          'Content-type': 'application/json'
        }
      }
    );
  }
}
