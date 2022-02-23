import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import authorizationBearer from '../../../app/services/authorizationBearer/authorizationBearer';
import { environment } from '../../../environments/environment';

@Injectable()
export class RssWidgetService {
  constructor(private http: HttpClient) {}

  public fetchDataFromRssFeed(url: string): Observable<string> {
    return this.http.get(`${environment.backend_url}/proxy/?url=${url}`, {
      headers: {
        Authorization: authorizationBearer()
      },
      responseType: 'text'
    });
  }
}
