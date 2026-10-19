import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { MiniWidgetTypeEnum } from "../../enums/MiniWidgetTypeEnum";
import { environment } from "../../../environments/environment";
import { IMiniWidgetConfig } from "../../model/IMiniWidgetConfig";

@Service()
export class MiniWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/miniWidget`;

  private readonly miniWidgetDeletedEvent = new Subject<number>();

  public get miniWidgetDeleted(): Observable<number> {
    return this.miniWidgetDeletedEvent.asObservable();
  }

  public notifyMiniWidgetDeleted(miniWidgetId: number): void {
    this.miniWidgetDeletedEvent.next(miniWidgetId);
  }

  public getMiniWidgets(): Observable<IMiniWidgetConfig[]> {
    return this.http.get<IMiniWidgetConfig[]>(`${this.baseUrl}/`);
  }

  public addMiniWidget(type: MiniWidgetTypeEnum): Observable<IMiniWidgetConfig> {
    return this.http.post<IMiniWidgetConfig>(`${this.baseUrl}/addMiniWidget`, { type });
  }

  public updateWidgetData(id: number, data: unknown): Observable<IMiniWidgetConfig> {
    return this.http.patch<IMiniWidgetConfig>(`${this.baseUrl}/updateWidgetData/${id}`, { data });
  }

  public deleteMiniWidget(widgetId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteMiniWidget?widgetId=${widgetId}`);
  }
}
