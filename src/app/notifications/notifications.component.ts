import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal
} from "@angular/core";
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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "dash-notifications",
  templateUrl: "./notifications.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NotificationsListComponent]
})
export class NotificationsComponent implements OnInit {
  public readonly notificationsFromDatabase: WritableSignal<INotification[]> = signal([]);
  public readonly notificationsToDisplay: WritableSignal<INotificationToDisplay[]> = signal([]);
  public readonly unreadNotificationsForBadge = signal(0);

  private readonly notificationService = inject(NotificationService);
  private readonly widgetService = inject(WidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly ERROR_MARKING_NOTIFICATION_AS_READ = "Erreur lors du traitement de la requête.";

  public constructor() {
    this.widgetService.refreshWidgetsAction.pipe(takeUntilDestroyed()).subscribe({
      next: () => this.fetchNotificationsFromDatabase()
    });
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
        this.notificationsFromDatabase.update((oldNotifications) => {
          return [
            ...oldNotifications.filter(
              (notification) =>
                !updatedNotifications.map((notif) => notif.id).includes(notification.id)
            ),
            ...updatedNotifications
          ].sort((timeA, timeB) => {
            if (timeA === timeB) return 0;
            return Date.parse(timeB.notificationDate) - Date.parse(timeA.notificationDate);
          });
        });
        this.notificationsToDisplay.set(this.computeNotificationsToDisplay());
        this.unreadNotificationsForBadge.set(this.computeUnreadNotificationsBadge());
      },
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_MARKING_NOTIFICATION_AS_READ)
    });
  }

  private fetchNotificationsFromDatabase(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notificationsFromDatabase.set(notifications.content);
        this.notificationsToDisplay.set(this.computeNotificationsToDisplay());
        this.unreadNotificationsForBadge.set(this.computeUnreadNotificationsBadge());
      }
    });
  }

  private computeNotificationsToDisplay(): INotificationToDisplay[] {
    return this.notificationsFromDatabase().map((notification) => {
      return {
        ...notification,
        ...{
          notificationDateToDisplay: this.computeDateToDisplay(notification.notificationDate),
          notificationTypeToDisplay: this.computeTypeToDisplay(notification.notificationType)
        }
      };
    });
  }

  private computeDateToDisplay(date: string): string {
    const parsedDate = new Date(Date.parse(date));
    if (isToday(parsedDate)) {
      return parsedDate.toLocaleTimeString("fr", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } else {
      return parsedDate.toLocaleString("fr", {
        day: "2-digit",
        month: "2-digit"
      });
    }
  }

  private computeTypeToDisplay(notificationType: NotificationTypeEnum): string {
    switch (notificationType) {
      case NotificationTypeEnum.INFO:
        return "info";
      case NotificationTypeEnum.WARN:
        return "warning";
    }
  }

  private computeUnreadNotificationsBadge(): number {
    return this.notificationsFromDatabase().filter((notif) => !notif.isRead).length;
  }
}
