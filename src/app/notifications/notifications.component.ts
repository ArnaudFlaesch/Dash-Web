import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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

const NOTIFICATION_TYPE_ICONS: Record<NotificationTypeEnum, string> = {
  [NotificationTypeEnum.INFO]: "info",
  [NotificationTypeEnum.WARN]: "warning"
};

@Component({
  selector: "dash-notifications",
  templateUrl: "./notifications.component.html",
  imports: [NotificationsListComponent]
})
export class NotificationsComponent implements OnInit {
  public readonly notificationsFromDatabase = signal<INotification[]>([]);
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

  public constructor() {
    inject(WidgetService)
      .refreshWidgetsAction.pipe(takeUntilDestroyed())
      .subscribe(() => this.fetchNotificationsFromDatabase());
  }

  public ngOnInit(): void {
    this.fetchNotificationsFromDatabase();
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

  private fetchNotificationsFromDatabase(): void {
    this.notificationService
      .getNotifications()
      .subscribe((notifications) => this.notificationsFromDatabase.set(notifications.content));
  }

  private computeDateToDisplay(date: string): string {
    const parsedDate = new Date(Date.parse(date));
    return isToday(parsedDate)
      ? parsedDate.toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })
      : parsedDate.toLocaleString("fr", { day: "2-digit", month: "2-digit" });
  }
}
