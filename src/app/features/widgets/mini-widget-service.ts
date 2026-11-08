import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { environment } from "@environments/environment";
import { MiniWidgetType } from "@widgets/mini-widget-type";
import { MiniWidgetConfig } from "@widgets/mini-widget-config";

@Service()
export class MiniWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/mini-widgets`;

  private readonly miniWidgetDeletedEvent = new Subject<number>();

  public get miniWidgetDeleted(): Observable<number> {
    return this.miniWidgetDeletedEvent.asObservable();
  }

  public notifyMiniWidgetDeleted(miniWidgetId: number): void {
    this.miniWidgetDeletedEvent.next(miniWidgetId);
  }

  public getMiniWidgets(): Observable<MiniWidgetConfig[]> {
    return this.http.get<MiniWidgetConfig[]>(this.baseUrl);
  }

  public addMiniWidget(type: MiniWidgetType): Observable<MiniWidgetConfig> {
    return this.http.post<MiniWidgetConfig>(this.baseUrl, { type });
  }

  public updateWidgetData(id: number, data: unknown): Observable<MiniWidgetConfig> {
    return this.http.patch<MiniWidgetConfig>(`${this.baseUrl}/${id}`, { data });
  }

  public deleteMiniWidget(widgetId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${widgetId}`);
  }
}
