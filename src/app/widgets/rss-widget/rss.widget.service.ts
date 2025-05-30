import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import authorizationBearer from "../../../app/services/authorizationBearer/authorizationBearer";
import { environment } from "../../../environments/environment";

@Injectable()
export class RssWidgetService {
  private readonly http = inject(HttpClient);

  public fetchDataFromRssFeed(url: string): Observable<string> {
    return this.http.get<string>(`${environment.backend_url}/rssWidget/?url=${url}`, {
      headers: {
        Authorization: authorizationBearer(),
        "Content-type": "application/json"
      }
    });
  }
}
