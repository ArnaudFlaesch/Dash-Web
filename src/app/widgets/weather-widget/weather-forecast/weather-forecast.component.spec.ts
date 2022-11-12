import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';

import { WeatherForecastComponent } from './weather-forecast.component';

describe('WeatherForecastComponent', () => {
  let spectator: Spectator<WeatherForecastComponent>;

  const createComponent = createComponentFactory({
    component: WeatherForecastComponent,
    imports: [],
    providers: [DateUtilsService]
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
