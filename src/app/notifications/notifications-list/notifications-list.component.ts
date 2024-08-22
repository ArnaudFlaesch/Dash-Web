import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { INotificationToDisplay, NotificationTypeEnum } from '../../model/INotification';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { MatBadge } from '@angular/material/badge';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';

@Component({
  selector: 'dash-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrl: './notifications-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  @Input() public notificationsList: INotificationToDisplay[] = [];
  @Input() public unreadNotificationsForBadge: number = 0;

  @Output() private onNotificationRead = new EventEmitter<number>();
  @Output() private onMarkAllNotificationsAsRead = new EventEmitter();

  public notificationTypeEnum = NotificationTypeEnum;

  public markNotificationAsRead(notificationId: number): void {
    this.onNotificationRead.emit(notificationId);
  }

  public markAllNotificationsAsRead(): void {
    this.onMarkAllNotificationsAsRead.emit();
  }
}
