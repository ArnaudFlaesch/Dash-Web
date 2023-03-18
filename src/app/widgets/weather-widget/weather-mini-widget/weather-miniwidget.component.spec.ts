import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { environment } from './../../../../environments/environment';

import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { WeatherWidgetService } from '../weather.widget.service';
import { WeatherMiniWidgetComponent } from './weather-miniwidget.component';
import { ErrorHandlerService } from '../../../services/error.handler.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('WeatherMiniWidgetComponent', () => {
  let spectator: Spectator<WeatherMiniWidgetComponent>;
  let weatherWidgetService: SpectatorHttp<WeatherWidgetService>;
  const createHttp = createHttpFactory(WeatherWidgetService);

  const createComponent = createComponentFactory({
    component: WeatherMiniWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [WeatherWidgetService, DateUtilsService, ErrorHandlerService]
  });

  beforeEach(() => {
    spectator = createComponent();
    weatherWidgetService = createHttp();
  });

  it('Should create widget', () => {
    expect(spectator.component.getWidgetData()).toEqual(undefined);
    expect(spectator.component.isFormValid()).toEqual(false);
    expect(spectator.component.isWidgetLoaded()).toEqual(false);

    const city = 'Paris';
    spectator.component.city = city;

    expect(spectator.component.getWidgetData()).toEqual({ city: city });
    expect(spectator.component.isFormValid()).toEqual(true);

    spectator.component.refreshWidget();

    const request = weatherWidgetService.expectOne(
      environment.backend_url + '/weatherWidget/weather?city=' + city,
      HttpMethod.GET
    );

    request.flush({});

    expect(spectator.component.isWidgetLoaded()).toEqual(true);
  });

  it('Should get weather icons', () => {
    const icon = 'sunny';
    expect(spectator.component.getIconFromWeatherApi(icon)).toEqual(
      `https://openweathermap.org/img/wn/${icon}@2x.png`
    );
  });
});
