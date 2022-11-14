import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';

import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { WeatherWidgetService } from '../weather.widget.service';
import { WeatherForecastComponent } from './weather-forecast.component';

describe('WeatherForecastComponent', () => {
  let spectator: Spectator<WeatherForecastComponent>;

  const createHttp = createHttpFactory(WeatherWidgetService);

  const createComponent = createComponentFactory({
    component: WeatherForecastComponent,
    imports: [],
    providers: [WeatherWidgetService, DateUtilsService]
  });

  beforeEach(() => {
    spectator = createComponent();
    createHttp();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
