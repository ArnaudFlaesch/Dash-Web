import { MatSnackBarModule } from '@angular/material/snack-bar';
import { createComponentFactory, createHttpFactory, Spectator, SpectatorHttp } from '@ngneat/spectator/jest';
import { ErrorHandlerService } from '../../services/error.handler.service';

import { AirParifWidgetComponent } from './airparif-widget.component';
import { AirParifWidgetService } from './airparif-widget.service';

describe('AirParifWidgetComponent', () => {
  let spectator: Spectator<AirParifWidgetComponent>;
  let airParifWidgetService: SpectatorHttp<AirParifWidgetService>;

  const communeInseeCode = "75112";
  const airParifToken = "AIRPARIFTOKEN";

  const createComponent = createComponentFactory({
    component: AirParifWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [
      AirParifWidgetService,
      ErrorHandlerService
    ]
  });
  const createHttpAirParifWidgetService = createHttpFactory(AirParifWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    airParifWidgetService = createHttpAirParifWidgetService();
  });

  it("Should create", () => {
    expect(spectator.component.airParifApiKey).toEqual(null)
  })

})