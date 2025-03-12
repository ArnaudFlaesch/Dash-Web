import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from "@angular/core";
import { isToday } from "date-fns";
import { Subject, takeUntil } from "rxjs";
import {
  INotification,
  INotificationToDisplay,
  NotificationTypeEnum
} from "../model/INotification";
import { ErrorHandlerService } from "../services/error.handler.service";
import { NotificationService } from "../services/notification.service/NotificationService";
import { WidgetService } from "../services/widget.service/widget.service";
import { NotificationsListComponent } from "./notifications-list/notifications-list.component";

@Component({
  selector: "dash-notifications",
  templateUrl: "./notifications.component.html",
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NotificationsListComponent]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  public notificationsFromDatabase: INotification[] = [];
  public notificationsToDisplay: INotificationToDisplay[] = [];
  public unreadNotificationsForBadge = 0;
  public notificationTypeEnum = NotificationTypeEnum;

  private readonly destroy$: Subject<unknown> = new Subject();

  private readonly notificationService = inject(NotificationService);
  private readonly widgetService = inject(WidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly ERROR_MARKING_NOTIFICATION_AS_READ = "Erreur lors du traitement de la requête.";

  public ngOnInit(): void {
    this.fetchNotificationsFromDatabase();
    this.widgetService.refreshWidgetsAction.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.fetchNotificationsFromDatabase()
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  public markNotificationAsRead(notificationId: number): void {
    this.markNotificationsAsRead([notificationId]);
  }

  public markAllNotificationsAsRead(): void {
    this.markNotificationsAsRead(this.notificationsFromDatabase.map((notif) => notif.id));
  }

  private markNotificationsAsRead(notificationIds: number[]): void {
    this.notificationService.markNotificationAsRead(notificationIds).subscribe({
      next: (updatedNotifications) => {
        this.notificationsFromDatabase = this.notificationsFromDatabase.filter(
          (notification) => !updatedNotifications.map((notif) => notif.id).includes(notification.id)
        );
        this.notificationsFromDatabase = [
          ...this.notificationsFromDatabase,
          ...updatedNotifications
        ].sort((timeA, timeB) => {
          if (timeA === timeB) return 0;
          return Date.parse(timeB.notificationDate) - Date.parse(timeA.notificationDate);
        });
        this.notificationsToDisplay = this.computeNotificationsToDisplay();
        this.unreadNotificationsForBadge = this.computeUnreadNotificationsBadge();
      },
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_MARKING_NOTIFICATION_AS_READ)
    });
  }

  private fetchNotificationsFromDatabase(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notificationsFromDatabase = notifications.content;
        this.notificationsToDisplay = this.computeNotificationsToDisplay();
        this.unreadNotificationsForBadge = this.computeUnreadNotificationsBadge();
      }
    });
  }

  private computeNotificationsToDisplay(): INotificationToDisplay[] {
    return this.notificationsFromDatabase.map((notification) => {
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
    return this.notificationsFromDatabase.filter((notif) => !notif.isRead).length;
  }
}
