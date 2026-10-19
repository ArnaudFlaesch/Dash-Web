import { Component, input, output } from "@angular/core";
import { MatBadge } from "@angular/material/badge";
import { MatIconButton, MatMiniFabButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuTrigger } from "@angular/material/menu";
import { MatTooltip } from "@angular/material/tooltip";
import { INotificationToDisplay, NotificationTypeEnum } from "../../model/INotification";
import { DateFormatPipe } from "../../pipes/date-format.pipe";

@Component({
  selector: "dash-notifications-list",
  templateUrl: "./notifications-list.component.html",
  styleUrl: "./notifications-list.component.scss",
  imports: [
    MatTooltip,
    MatIcon,
    MatIconButton,
    MatMiniFabButton,
    MatMenuTrigger,
    MatBadge,
    MatMenu,
    DateFormatPipe
  ]
})
export class NotificationsListComponent {
  public readonly notificationsList = input.required<INotificationToDisplay[]>();
  public readonly unreadNotificationsForBadge = input<number>(0);

  public readonly markNotificationAsReadEvent = output<number>();
  public readonly markAllNotificationsAsReadEvent = output();

  public readonly notificationTypeEnum = NotificationTypeEnum;
}
