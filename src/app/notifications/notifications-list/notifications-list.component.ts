import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { INotificationToDisplay, NotificationTypeEnum } from '../../model/INotification';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrl: './notifications-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
