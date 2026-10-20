import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Service()
export class RssWidgetService {
  private readonly http = inject(HttpClient);

  public fetchDataFromRssFeed(url: string): Observable<unknown> {
    return this.http.get<unknown>(`${environment.backend_url}/rssWidget/?url=${url}`);
  }
}
