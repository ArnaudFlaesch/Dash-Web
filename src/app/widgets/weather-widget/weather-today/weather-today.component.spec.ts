import { createComponentFactory, createHttpFactory, Spectator } from '@ngneat/spectator/jest';

import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { WeatherWidgetService } from '../weather.widget.service';
import { WeatherTodayComponent } from './weather-today.component';

describe('WeatherTodayComponent', () => {
  let spectator: Spectator<WeatherTodayComponent>;
  const createHttp = createHttpFactory(WeatherWidgetService);

  const createComponent = createComponentFactory({
    component: WeatherTodayComponent,
    imports: [],
    providers: [WeatherWidgetService, DateUtilsService]
  });

  beforeEach(() => {
    spectator = createComponent();
    createHttp();
  });

  it('Should get weather icons', () => {
    const icon = 'sunny';
    expect(spectator.component.getIconFromWeatherApi(icon)).toEqual(
      `https://openweathermap.org/img/wn/${icon}@2x.png`
    );
  });
});
