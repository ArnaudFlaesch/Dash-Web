import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { INotificationToDisplay, NotificationTypeEnum } from '../../model/INotification';
import { DateFormatPipe } from '../../pipes/date-format.pipe';

@Component({
  selector: 'dash-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrl: './notifications-list.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [NgClass, MatTooltip, MatIcon, MatIconButton, DateFormatPipe]
})
export class NotificationsListComponent {
  @Input()
  public notificationsList: INotificationToDisplay[] = [];

  @Output() onNotificationRead = new EventEmitter<number>();

  public notificationTypeEnum = NotificationTypeEnum;

  public markNotificationAsRead(notificationId: number): void {
    this.onNotificationRead.emit(notificationId);
  }
}
