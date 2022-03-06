import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { ErrorHandlerService } from './../services/error.handler.service';
import { TabService } from './../services/tab.service/tab.service';
import { TabComponent } from './tab.component';

describe('TabComponent', () => {
  let spectator: Spectator<TabComponent>;
  let tabService: SpectatorHttp<TabService>;

  const createComponent = createComponentFactory({
    component: TabComponent,
    imports: [MatSnackBarModule],
    providers: [ErrorHandlerService],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(TabService);

  beforeEach(() => (spectator = createComponent()));

  it('Dummy test', () => {
    expect(true).toEqual(true);
  });
});
