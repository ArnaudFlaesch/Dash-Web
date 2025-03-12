import { NgClass } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { MatIconButton, MatMiniFabButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { INotificationToDisplay, NotificationTypeEnum } from "../../model/INotification";
import { DateFormatPipe } from "../../pipes/date-format.pipe";
import { MatBadge } from "@angular/material/badge";
import { MatMenu, MatMenuTrigger } from "@angular/material/menu";

@Component({
  selector: "dash-notifications-list",
  templateUrl: "./notifications-list.component.html",
  styleUrl: "./notifications-list.component.scss",
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    NgClass,
    MatTooltip,
    MatIcon,
    MatIconButton,
    DateFormatPipe,
    MatMiniFabButton,
    MatTooltip,
    MatMenuTrigger,
    MatIcon,
    MatBadge,
    MatMenu,
    MatIconButton
  ]
})
export class NotificationsListComponent {
  public readonly notificationsList = input.required<INotificationToDisplay[]>();
  public readonly unreadNotificationsForBadge = input<number>(0);

  public readonly onNotificationRead = output<number>();
  public readonly onMarkAllNotificationsAsRead = output();

  public notificationTypeEnum = NotificationTypeEnum;

  public markNotificationAsRead(notificationId: number): void {
    this.onNotificationRead.emit(notificationId);
  }

  public markAllNotificationsAsRead(): void {
    this.onMarkAllNotificationsAsRead.emit();
  }
}
