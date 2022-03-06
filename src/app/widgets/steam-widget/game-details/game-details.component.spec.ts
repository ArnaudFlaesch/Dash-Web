import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { ErrorHandlerService } from '../../../services/error.handler.service';
import { SteamWidgetService } from '../steam.widget.service';
import { GameDetailsComponent } from './game-details.component';

describe('GameDetailsComponent', () => {
  let spectator: Spectator<GameDetailsComponent>;
  let steamWidgetService: SpectatorHttp<SteamWidgetService>;

  const createComponent = createComponentFactory({
    component: GameDetailsComponent,
    imports: [MatSnackBarModule],
    providers: [SteamWidgetService, ErrorHandlerService],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(SteamWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    steamWidgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
