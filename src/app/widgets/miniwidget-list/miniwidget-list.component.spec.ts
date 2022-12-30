import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { MiniWidgetListComponent } from './miniwidget-list.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MiniWidgetService } from '../../services/widget.service/miniwidget.service';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { environment } from '../../../environments/environment';

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
    request.flush([]);
    expect(spectator.component.miniWidgetList).toEqual([]);
  });
});
