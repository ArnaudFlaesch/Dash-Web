import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createHttpFactory,
  createRoutingFactory,
  SpectatorHttp,
  SpectatorRouting
} from '@ngneat/spectator/jest';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { StravaWidgetComponent } from './strava-widget.component';
import { StravaWidgetService } from './strava.widget.service';

describe('StravaWidgetComponent', () => {
  let spectator: SpectatorRouting<StravaWidgetComponent>;
  let stravaWidgetService: SpectatorHttp<StravaWidgetService>;

  const createComponent = createRoutingFactory({
    component: StravaWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [StravaWidgetService, ErrorHandlerService]
  });
  const createHttp = createHttpFactory(StravaWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    stravaWidgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
