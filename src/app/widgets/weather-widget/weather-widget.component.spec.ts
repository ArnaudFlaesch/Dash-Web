import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ErrorHandlerService } from './../../services/error.handler.service';
import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { DateUtilsService } from '../../utils/date.utils';
import { WeatherWidgetComponent } from './weather-widget.component';
import { WeatherWidgetService } from './weather.widget.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('WeatherWidgetComponent', () => {
  let spectator: Spectator<WeatherWidgetComponent>;
  let weatherWidgetService: SpectatorHttp<WeatherWidgetService>;

  const createComponent = createComponentFactory({
    component: WeatherWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [WeatherWidgetService, DateUtilsService, ErrorHandlerService],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(WeatherWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    weatherWidgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
