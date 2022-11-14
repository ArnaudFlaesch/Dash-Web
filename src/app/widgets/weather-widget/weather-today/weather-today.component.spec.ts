import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { WeatherWidgetService } from '../weather.widget.service';
import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { WeatherTodayComponent } from './weather-today.component';

describe('WeatherTodayComponent', () => {
  let spectator: Spectator<WeatherTodayComponent>;
  let weatherWidgetService: SpectatorHttp<WeatherWidgetService>;
  const createHttp = createHttpFactory(WeatherWidgetService);

  const createComponent = createComponentFactory({
    component: WeatherTodayComponent,
    imports: [],
    providers: [WeatherWidgetService, DateUtilsService]
  });

  beforeEach(() => {
    spectator = createComponent();
    weatherWidgetService = createHttp();
  });

  it('Should get weather icons', () => {
    const icon = 'sunny';
    expect(spectator.component.getIconFromWeatherApi(icon)).toEqual(
      `https://openweathermap.org/img/wn/${icon}@2x.png`
    );
  });
});
