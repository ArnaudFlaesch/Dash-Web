import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  Spectator,
  SpectatorHttp,
  createComponentFactory,
  createHttpFactory
} from '@ngneat/spectator';
import { ErrorHandlerService } from '../../services/error.handler.service';

import { TwitterWidgetComponent } from './twitter-widget.component';
import { TwitterWidgetService } from './twitter.widget.service';

describe('TwitterWidgetComponent', () => {
  let spectator: Spectator<TwitterWidgetComponent>;
  let twitterWidgetService: SpectatorHttp<TwitterWidgetService>;

  const createComponent = createComponentFactory({
    component: TwitterWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [TwitterWidgetService, ErrorHandlerService],
    schemas: []
  });
  const createHttp = createHttpFactory(TwitterWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    twitterWidgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
