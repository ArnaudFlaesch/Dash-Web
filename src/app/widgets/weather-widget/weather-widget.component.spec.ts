import { environment } from './../../../environments/environment';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ErrorHandlerService } from './../../services/error.handler.service';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
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

  const weatherData = {
    coord: { lon: 2.3488, lat: 48.8534 },
    weather: [{ id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01d' }],
    base: 'stations',
    main: {
      temp: 7.57,
      feels_like: 3.75,
      temp_min: 6.11,
      temp_max: 8.54,
      pressure: 1022,
      humidity: 45
    },
    visibility: 10000,
    wind: { speed: 7.2, deg: 50 },
    clouds: { all: 0 },
    dt: 1646586617,
    sys: { type: 2, id: 2041230, country: 'FR', sunrise: 1646547788, sunset: 1646588459 },
    timezone: 3600,
    id: 2988507,
    name: 'Paris',
    cod: 200
  };

  const forecastData = {
    cod: '200',
    message: 0,
    cnt: 40,
    list: [
      {
        dt: 1646589600,
        main: {
          temp: 7.57,
          feels_like: 5.19,
          temp_min: 7.23,
          temp_max: 7.57,
          pressure: 1022,
          sea_level: 1022,
          grnd_level: 1018,
          humidity: 45,
          temp_kf: 0.34
        },
        weather: [{ id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01n' }],
        clouds: { all: 0 },
        wind: { speed: 3.68, deg: 43, gust: 7.45 },
        visibility: 10000,
        pop: 0,
        sys: { pod: 'n' },
        dt_txt: '2022-03-06 18:00:00'
      },
      {
        dt: 1646600400,
        main: {
          temp: 6.76,
          feels_like: 3.67,
          temp_min: 5.15,
          temp_max: 6.76,
          pressure: 1023,
          sea_level: 1023,
          grnd_level: 1019,
          humidity: 49,
          temp_kf: 1.61
        },
        weather: [{ id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01n' }],
        clouds: { all: 3 },
        wind: { speed: 4.71, deg: 38, gust: 10.19 },
        visibility: 10000,
        pop: 0,
        sys: { pod: 'n' },
        dt_txt: '2022-03-06 21:00:00'
      },
      {
        dt: 1646611200,
        main: {
          temp: 4.78,
          feels_like: 1.44,
          temp_min: 3.39,
          temp_max: 4.78,
          pressure: 1023,
          sea_level: 1023,
          grnd_level: 1019,
          humidity: 56,
          temp_kf: 1.39
        },
        weather: [{ id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01n' }],
        clouds: { all: 6 },
        wind: { speed: 4.26, deg: 41, gust: 9.9 },
        visibility: 10000,
        pop: 0,
        sys: { pod: 'n' },
        dt_txt: '2022-03-07 00:00:00'
      },
      {
        dt: 1646622000,
        main: {
          temp: 1.93,
          feels_like: -1.6,
          temp_min: 1.93,
          temp_max: 1.93,
          pressure: 1023,
          sea_level: 1023,
          grnd_level: 1018,
          humidity: 66,
          temp_kf: 0
        },
        weather: [{ id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01n' }],
        clouds: { all: 6 },
        wind: { speed: 3.54, deg: 39, gust: 8.33 },
        visibility: 10000,
        pop: 0,
        sys: { pod: 'n' },
        dt_txt: '2022-03-07 03:00:00'
      }
    ],
    city: {
      id: 2988507,
      name: 'Paris',
      coord: { lat: 48.8534, lon: 2.3488 },
      country: 'FR',
      population: 2138551,
      timezone: 3600,
      sunrise: 1646547788,
      sunset: 1646588459
    }
  };

  beforeEach(() => {
    spectator = createComponent();
    weatherWidgetService = createHttp();
  });

  it('should create', () => {
    const cityName = 'Paris';
    expect(spectator.component.cityData).toEqual(undefined);
    expect(spectator.component.forecast).toEqual([]);
    spectator.component.city = cityName;
    spectator.component.refreshWidget();

    const dataRequests = weatherWidgetService.expectConcurrent([
      {
        url: environment.backend_url + '/weatherWidget/weather?city=' + cityName,
        method: HttpMethod.GET
      },
      {
        url: environment.backend_url + '/weatherWidget/forecast?city=' + cityName,
        method: HttpMethod.GET
      }
    ]);

    weatherWidgetService.flushAll(dataRequests, [weatherData, forecastData]);

    expect(spectator.component.cityData?.name).toEqual(cityName);
    expect(spectator.component.forecast.length).toEqual(forecastData.list.length);
  });
});
