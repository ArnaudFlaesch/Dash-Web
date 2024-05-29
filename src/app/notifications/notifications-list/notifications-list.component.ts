import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { INotificationToDisplay, NotificationTypeEnum } from '../../model/INotification';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'dash-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrl: './notifications-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
