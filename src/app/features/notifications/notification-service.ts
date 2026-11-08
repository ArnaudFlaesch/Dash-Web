import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { AppNotification } from "@features/notifications/app-notification";
import { Page } from "@shared/pagination/page";

@Service()
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/notifications`;

  public getNotifications(): Observable<Page<AppNotification>> {
    return this.http.get<Page<AppNotification>>(this.baseUrl);
  }

  public markNotificationAsRead(notificationIds: number[]): Observable<AppNotification[]> {
    return this.http.put<AppNotification[]>(`${this.baseUrl}/read`, {
      notificationIds
    });
  }
}
