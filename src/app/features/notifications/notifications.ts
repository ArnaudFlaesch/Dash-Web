import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject } from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { isToday } from "date-fns";
import {
  AppNotification,
  NotificationToDisplay,
  NotificationType
} from "@features/notifications/app-notification";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { NotificationService } from "@features/notifications/notification-service";
import { WidgetService } from "@widgets/widget-service";
import { NotificationsList } from "./notifications-list/notifications-list";
import { catchError, map, of } from "rxjs";

@Component({
  selector: "dash-notifications",
  templateUrl: "./notifications.html",
  imports: [NotificationsList]
})
export class Notifications {
  private readonly NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
    [NotificationType.INFO]: "info",
    [NotificationType.WARN]: "warning"
  };

  private readonly ERROR_MESSAGES = {
    markingNotificationAsRead: "Erreur lors du traitement de la requête.",
    gettingNotifications: "Erreur lors de la récupération des notifications."
  };

  /** Notifications, reloaded each time the widgets are refreshed. */
  private readonly notificationsResource = rxResource({
    stream: () =>
      this.notificationService.getNotifications().pipe(
        map((notifications) => notifications.content),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingNotifications);
          return of([]);
        })
      ),
    defaultValue: [] as AppNotification[]
  });

  private readonly notificationsFromDatabase = this.notificationsResource.value;
  protected readonly notificationsToDisplay = computed<NotificationToDisplay[]>(() =>
    this.notificationsFromDatabase().map((notification) => ({
      ...notification,
      notificationDateToDisplay: this.computeDateToDisplay(notification.notificationDate),
      notificationTypeToDisplay: this.NOTIFICATION_TYPE_ICONS[notification.notificationType]
    }))
  );
  protected readonly unreadNotificationsForBadge = computed(
    () => this.notificationsFromDatabase().filter((notification) => !notification.isRead).length
  );

  private readonly notificationService = inject(NotificationService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public constructor() {
    inject(WidgetService)
      .refreshWidgetsAction.pipe(takeUntilDestroyed())
      .subscribe(() => this.notificationsResource.reload());
  }

  protected markNotificationAsRead(notificationId: number): void {
    this.markNotificationsAsRead([notificationId]);
  }

  protected markAllNotificationsAsRead(): void {
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
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.markingNotificationAsRead)
    });
  }

  private computeDateToDisplay(date: string): string {
    const parsedDate = new Date(Date.parse(date));
    return isToday(parsedDate)
      ? parsedDate.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })
      : parsedDate.toLocaleString("fr", { day: "2-digit", month: "2-digit" });
  }
}
