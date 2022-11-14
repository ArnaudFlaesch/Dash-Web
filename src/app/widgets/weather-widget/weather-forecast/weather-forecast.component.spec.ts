import {
  Spectator,
  createComponentFactory,
  createHttpFactory,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { WeatherWidgetService } from '../weather.widget.service';

import { WeatherForecastComponent } from './weather-forecast.component';

describe('WeatherForecastComponent', () => {
  let spectator: Spectator<WeatherForecastComponent>;
  let weatherWidgetService: SpectatorHttp<WeatherWidgetService>;

  const createHttp = createHttpFactory(WeatherWidgetService);

  const createComponent = createComponentFactory({
    component: WeatherForecastComponent,
    imports: [],
    providers: [WeatherWidgetService, DateUtilsService]
  });

  beforeEach(() => {
    spectator = createComponent();
    weatherWidgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
