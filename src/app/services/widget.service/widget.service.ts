import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { WidgetTypeEnum } from "../../enums/WidgetTypeEnum";
import { environment } from "../../../environments/environment";
import { IWidgetConfig } from "../../model/IWidgetConfig";

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

  public getWidgets(tabId: number): Observable<IWidgetConfig[]> {
    return this.http.get<IWidgetConfig[]>(`${this.baseUrl}/?tabId=${tabId}`);
  }

  public addWidget(type: WidgetTypeEnum, tabId: number): Observable<IWidgetConfig> {
    return this.http.post<IWidgetConfig>(`${this.baseUrl}/addWidget`, { type, tabId });
  }

  public updateWidgetData(id: number, data: unknown): Observable<IWidgetConfig> {
    return this.http.patch<IWidgetConfig>(`${this.baseUrl}/updateWidgetData/${id}`, { data });
  }

  public updateWidgetsOrder(widgetsData: IWidgetConfig[]): Observable<IWidgetConfig[]> {
    return this.http.post<IWidgetConfig[]>(`${this.baseUrl}/updateWidgetsOrder`, widgetsData);
  }

  public deleteWidget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteWidget?id=${id}`);
  }
}
