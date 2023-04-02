import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { format } from 'date-fns';

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

  it('should create', () => {
    const notificationDate = new Date();
    const notificationsData = {
      content: [
        {
          id: 1,
          message: 'user: Connexion utilisateur',
          notificationType: NotificationTypeEnum.WARN,
          notificationDate: notificationDate.toString(),
          isRead: false
        }
      ],
      totalPages: 1,
      totalElements: 1,
      last: true,
      size: 1,
      number: 0
    } as Pageable<INotification>;

    const notificationsRequest = notificationsService.expectOne(
      environment.backend_url + '/notifications/',
      HttpMethod.GET
    );
    notificationsRequest.flush(notificationsData);

    const expectedNotificationsToDisplay = [
      {
        ...notificationsData.content[0],
        ...{
          notificationDateToDisplay: format(notificationDate, 'HH:mm'),
          notificationTypeToDisplay: 'warning'
        }
      }
    ];

    expect(spectator.component.notificationsFromDatabase).toEqual(notificationsData.content);
    expect(spectator.component.notificationsToDisplay).toEqual(expectedNotificationsToDisplay);
  });
});
