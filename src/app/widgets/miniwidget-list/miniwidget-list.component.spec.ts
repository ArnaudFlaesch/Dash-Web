import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';

import { environment } from '../../../environments/environment';
import { MiniWidgetTypeEnum } from '../../enums/MiniWidgetTypeEnum';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { MiniWidgetService } from '../../services/widget.service/miniwidget.service';
import { MiniWidgetListComponent } from './miniwidget-list.component';

describe('MiniWidgetListComponent', () => {
  let spectator: Spectator<MiniWidgetListComponent>;
  let miniWidgetService: SpectatorHttp<MiniWidgetService>;

  const createComponent = createComponentFactory({
    component: MiniWidgetListComponent,
    providers: [MiniWidgetService, ErrorHandlerService],
    imports: [MatDialogModule, MatSnackBarModule],
    schemas: [NO_ERRORS_SCHEMA]
  });

  const createHttp = createHttpFactory(MiniWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    miniWidgetService = createHttp();
  });

  it('should have no widgets', () => {
    const request = miniWidgetService.expectOne(
      environment.backend_url + '/miniWidget/',
      HttpMethod.GET
    );
    request.flush([
      {
        id: 70,
        type: MiniWidgetTypeEnum.WEATHER
      }
    ]);
    expect(spectator.component.miniWidgetList.length).toEqual(1);
  });
});
