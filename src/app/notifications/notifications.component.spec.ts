import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { format, startOfYesterday } from 'date-fns';

import { Pageable } from '../../app/model/IPage';
import { environment } from '../../environments/environment';
import { INotification, NotificationTypeEnum } from '../model/INotification';
import { ErrorHandlerService } from '../services/error.handler.service';
import { NotificationService } from '../services/notification.service/NotificationService';
import { WidgetService } from '../services/widget.service/widget.service';
import { NotificationsComponent } from './notifications.component';

describe('NotificationsComponent', () => {
  let spectator: Spectator<NotificationsComponent>;
  let notificationsService: SpectatorHttp<NotificationService>;

  const createComponent = createComponentFactory({
    component: NotificationsComponent,
    imports: [MatSnackBarModule, MatMenuModule],
    providers: [WidgetService, ErrorHandlerService],
    schemas: []
  });
  const createHttp = createHttpFactory(NotificationService);

  beforeEach(() => {
    spectator = createComponent();
    notificationsService = createHttp();
  });

  it('should create component and get notifications', () => {
    const notificationDate = new Date();
    const notificationsData = {
      content: [
        {
          id: 1,
          message: 'username: Connexion utilisateur',
          notificationType: NotificationTypeEnum.WARN,
          notificationDate: notificationDate.toString(),
          isRead: false
        },
        {
          id: 2,
          message: 'username: Action user',
          notificationType: NotificationTypeEnum.INFO,
          notificationDate: notificationDate.toString(),
          isRead: false
        },
        {
          id: 3,
          message: 'username: Action user',
          notificationType: NotificationTypeEnum.INFO,
          notificationDate: startOfYesterday(),
          isRead: true
        }
      ],
      totalPages: 1,
      totalElements: 3,
      last: true,
      size: 1,
      number: 0
    } as Pageable<INotification>;

    const notificationsRequest = notificationsService.expectOne(
      environment.backend_url + '/notifications/',
      HttpMethod.GET
    );
    notificationsRequest.flush(notificationsData);

    expect(spectator.component.notificationsFromDatabase).toEqual(notificationsData.content);
    expect(spectator.component.notificationsToDisplay[0].notificationTypeToDisplay).toEqual(
      'warning'
    );
    expect(spectator.component.notificationsToDisplay[1].notificationTypeToDisplay).toEqual('info');
    expect(spectator.component.notificationsToDisplay[1].notificationTypeToDisplay).toEqual('info');
    expect(spectator.component.unreadNotificationsForBadge).toEqual('2');
  });
});
