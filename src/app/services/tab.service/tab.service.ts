import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ITab } from "../../model/Tab";

@Service()
export class TabService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/tab`;

  public getTabs(): Observable<ITab[]> {
    return this.http.get<ITab[]>(`${this.baseUrl}/`);
  }

  public addTab(label: string): Observable<ITab> {
    return this.http.post<ITab>(`${this.baseUrl}/addTab`, { label });
  }

  public updateTab(id: number, label: string, tabOrder: number): Observable<ITab> {
    return this.http.post<ITab>(`${this.baseUrl}/updateTab`, { id, label, tabOrder });
  }

  public updateTabs(tabs: ITab[]): Observable<ITab[]> {
    return this.http.post<ITab[]>(`${this.baseUrl}/updateTabs`, tabs);
  }

  public deleteTab(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteTab?id=${id}`);
  }
}
