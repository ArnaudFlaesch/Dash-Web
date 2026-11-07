import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { Tab } from "@features/tab/tab";

@Service()
export class TabService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/tab`;

  public getTabs(): Observable<Tab[]> {
    return this.http.get<Tab[]>(`${this.baseUrl}/`);
  }

  public addTab(label: string): Observable<Tab> {
    return this.http.post<Tab>(`${this.baseUrl}/addTab`, { label });
  }

  public updateTab(id: number, label: string, tabOrder: number): Observable<Tab> {
    return this.http.post<Tab>(`${this.baseUrl}/updateTab`, { id, label, tabOrder });
  }

  public updateTabs(tabs: Tab[]): Observable<Tab[]> {
    return this.http.post<Tab[]>(`${this.baseUrl}/updateTabs`, tabs);
  }

  public deleteTab(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteTab`, { params: { id } });
  }
}
