import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { INotification } from "../../model/INotification";
import { IPage } from "../../model/IPage";

@Service()
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/notifications`;

  public getNotifications(): Observable<IPage<INotification>> {
    return this.http.get<IPage<INotification>>(`${this.baseUrl}/`);
  }

  public markNotificationAsRead(notificationIds: number[]): Observable<INotification[]> {
    return this.http.put<INotification[]>(`${this.baseUrl}/markNotificationAsRead`, {
      notificationIds
    });
  }
}
