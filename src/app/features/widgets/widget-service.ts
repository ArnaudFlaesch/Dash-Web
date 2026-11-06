import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { environment } from "@environments/environment";
import { WidgetType } from "@widgets/widget-type";
import { WidgetConfig } from "@widgets/widget-config";

@Service()
export class WidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/widget`;

  private readonly widgetDeletedEvent = new Subject<number>();
  private readonly refreshWidgetsEvent = new Subject<void>();

  public get widgetDeleted(): Observable<number> {
    return this.widgetDeletedEvent.asObservable();
  }

  public get refreshWidgetsAction(): Observable<void> {
    return this.refreshWidgetsEvent.asObservable();
  }

  public notifyWidgetDeleted(widgetId: number): void {
    this.widgetDeletedEvent.next(widgetId);
  }

  public refreshAllWidgets(): void {
    this.refreshWidgetsEvent.next();
  }

  public getWidgets(tabId: number): Observable<WidgetConfig[]> {
    return this.http.get<WidgetConfig[]>(`${this.baseUrl}/`, { params: { tabId } });
  }

  public addWidget(type: WidgetType, tabId: number): Observable<WidgetConfig> {
    return this.http.post<WidgetConfig>(`${this.baseUrl}/addWidget`, { type, tabId });
  }

  public updateWidgetData(id: number, data: unknown): Observable<WidgetConfig> {
    return this.http.patch<WidgetConfig>(`${this.baseUrl}/updateWidgetData/${id}`, { data });
  }

  public updateWidgetsOrder(widgetsData: WidgetConfig[]): Observable<WidgetConfig[]> {
    return this.http.post<WidgetConfig[]>(`${this.baseUrl}/updateWidgetsOrder`, widgetsData);
  }

  public deleteWidget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteWidget`, { params: { id } });
  }
}
