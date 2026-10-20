import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject } from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { isToday } from "date-fns";
import {
  INotification,
  INotificationToDisplay,
  NotificationTypeEnum
} from "../model/INotification";
import { ErrorHandlerService } from "../services/error.handler.service";
import { NotificationService } from "../services/notification.service/NotificationService";
import { WidgetService } from "../services/widget.service/widget.service";
import { NotificationsListComponent } from "./notifications-list/notifications-list.component";
import { catchError, map, of } from "rxjs";

const NOTIFICATION_TYPE_ICONS: Record<NotificationTypeEnum, string> = {
  [NotificationTypeEnum.INFO]: "info",
  [NotificationTypeEnum.WARN]: "warning"
};

@Component({
  selector: "dash-notifications",
  templateUrl: "./notifications.component.html",
  imports: [NotificationsListComponent]
})
export class NotificationsComponent {
  /** Notifications, reloaded each time the widgets are refreshed. */
  public readonly notificationsResource = rxResource({
    stream: () =>
      this.notificationService.getNotifications().pipe(
        map((notifications) => notifications.content),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_NOTIFICATIONS);
          return of([]);
        })
      ),
    defaultValue: [] as INotification[]
  });

  public readonly notificationsFromDatabase = this.notificationsResource.value;
  public readonly notificationsToDisplay = computed<INotificationToDisplay[]>(() =>
    this.notificationsFromDatabase().map((notification) => ({
      ...notification,
      notificationDateToDisplay: this.computeDateToDisplay(notification.notificationDate),
      notificationTypeToDisplay: NOTIFICATION_TYPE_ICONS[notification.notificationType]
    }))
  );
  public readonly unreadNotificationsForBadge = computed(
    () => this.notificationsFromDatabase().filter((notification) => !notification.isRead).length
  );

  private readonly notificationService = inject(NotificationService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly ERROR_MARKING_NOTIFICATION_AS_READ = "Erreur lors du traitement de la requête.";
  private readonly ERROR_GETTING_NOTIFICATIONS =
    "Erreur lors de la récupération des notifications.";

  public constructor() {
    inject(WidgetService)
      .refreshWidgetsAction.pipe(takeUntilDestroyed())
      .subscribe(() => this.notificationsResource.reload());
  }

  public markNotificationAsRead(notificationId: number): void {
    this.markNotificationsAsRead([notificationId]);
  }

  public markAllNotificationsAsRead(): void {
    this.markNotificationsAsRead(this.notificationsFromDatabase().map((notif) => notif.id));
  }

  private markNotificationsAsRead(notificationIds: number[]): void {
    this.notificationService.markNotificationAsRead(notificationIds).subscribe({
      next: (updatedNotifications) => {
        const updatedIds = new Set(updatedNotifications.map((notification) => notification.id));
        this.notificationsFromDatabase.update((oldNotifications) =>
          [
            ...oldNotifications.filter((notification) => !updatedIds.has(notification.id)),
            ...updatedNotifications
          ].sort(
            (notifA, notifB) =>
              Date.parse(notifB.notificationDate) - Date.parse(notifA.notificationDate)
          )
        );
      },
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_MARKING_NOTIFICATION_AS_READ)
    });
  }

  private computeDateToDisplay(date: string): string {
    const parsedDate = new Date(Date.parse(date));
    return isToday(parsedDate)
      ? parsedDate.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })
      : parsedDate.toLocaleString("fr", { day: "2-digit", month: "2-digit" });
  }
}
