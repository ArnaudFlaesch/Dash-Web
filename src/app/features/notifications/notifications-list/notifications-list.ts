import { Component, input, output } from "@angular/core";
import { MatBadge } from "@angular/material/badge";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuTrigger } from "@angular/material/menu";
import { MatTooltip } from "@angular/material/tooltip";
import {
  INotificationToDisplay,
  NotificationTypeEnum
} from "@features/notifications/notification.model";
import { DateFormatPipe } from "@shared/pipes/date-format-pipe";

@Component({
  selector: "dash-notifications-list",
  templateUrl: "./notifications-list.html",
  styleUrl: "./notifications-list.scss",
  imports: [MatTooltip, MatIcon, MatIconButton, MatMenuTrigger, MatBadge, MatMenu, DateFormatPipe]
})
export class NotificationsList {
  public readonly labels = {
    notifications: "Notifications",
    markAllAsRead: "Marquer tout comme lu"
  };

  public readonly notificationsList = input.required<INotificationToDisplay[]>();
  public readonly unreadNotificationsForBadge = input<number>(0);

  public readonly markNotificationAsReadEvent = output<number>();
  public readonly markAllNotificationsAsReadEvent = output();

  public readonly notificationTypeEnum = NotificationTypeEnum;
}
