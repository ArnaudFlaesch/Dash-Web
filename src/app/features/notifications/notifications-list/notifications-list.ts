import { Component, input, output } from "@angular/core";
import { MatBadge } from "@angular/material/badge";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuTrigger } from "@angular/material/menu";
import { MatTooltip } from "@angular/material/tooltip";
import { NotificationToDisplay, NotificationType } from "@features/notifications/app-notification";
import { DateFormatPipe } from "@shared/dates/date-format-pipe";

@Component({
  selector: "dash-notifications-list",
  templateUrl: "./notifications-list.html",
  styleUrl: "./notifications-list.scss",
  imports: [MatTooltip, MatIcon, MatIconButton, MatMenuTrigger, MatBadge, MatMenu, DateFormatPipe]
})
export class NotificationsList {
  protected readonly labels = {
    notifications: "Notifications",
    markAllAsRead: "Marquer tout comme lu"
  };

  public readonly notificationsList = input.required<NotificationToDisplay[]>();
  public readonly unreadNotificationsForBadge = input<number>(0);

  public readonly markNotificationAsReadEvent = output<number>();
  public readonly markAllNotificationsAsReadEvent = output();

  protected readonly NotificationType = NotificationType;
}
