import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { WidgetService } from './../../services/widget.service/widget.service';
import { WidgetListComponent } from './widget-list.component';

describe('WidgetListComponent', () => {
  let spectator: Spectator<WidgetListComponent>;
  let widgetService: SpectatorHttp<WidgetService>;

  const createComponent = createComponentFactory({
    component: WidgetListComponent,
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(WidgetService);

  beforeEach(() => {
    spectator = createComponent();
    widgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
