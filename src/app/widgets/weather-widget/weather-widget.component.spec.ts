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
import { WeatherWidgetComponent } from './weather-widget.component';
import { WeatherWidgetService } from './weather.widget.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { format } from 'date-fns';
import { advanceTo } from 'jest-date-mock';
import { IForecastAPIResponse } from './IWeather';

describe('WeatherWidgetComponent', () => {
  let spectator: Spectator<WeatherWidgetComponent>;
  let weatherWidgetService: SpectatorHttp<WeatherWidgetService>;
  advanceTo(new Date(2022, 2, 6, 0, 0, 0)); // 06/03/2022

  const createComponent = createComponentFactory({
    component: WeatherWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [WeatherWidgetService, DateUtilsService, ErrorHandlerService],
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(WeatherWidgetService);

  const weatherData = {
    coord: { lon: 2.3488, lat: 48.8534 },
    weather: [
      { id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01d' }
    ],
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
    sys: {
      type: 2,
      id: 2041230,
      country: 'FR',
      sunrise: 1646547788,
      sunset: 1646588459
    },
    timezone: 3600,
    id: 2988507,
    name: 'Paris',
    cod: 200
  };

  const forecastData: IForecastAPIResponse = {
    cod: '200',
    message: 0,
    cnt: 40,
    list: [
      {
        dt: 1646589600,
        main: {
          temp: 7.57,
          feelsLike: 5.19,
          tempMin: 7.23,
          tempMax: 7.57,
          pressure: 1022,
          seaLevel: 1022,
          grndLevel: 1018,
          humidity: 45,
          tempKf: 0.34
        },
        weather: [
          { id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01n' }
        ],
        clouds: { all: 0 },
        wind: { speed: 3.68, deg: 43 },
        sys: { pod: 'n' },
        dtText: '2022-03-06 18:00:00'
      },
      {
        dt: 1646600400,
        main: {
          temp: 6.76,
          feelsLike: 3.67,
          tempMin: 5.15,
          tempMax: 6.76,
          pressure: 1023,
          seaLevel: 1023,
          grndLevel: 1019,
          humidity: 49,
          tempKf: 1.61
        },
        weather: [
          { id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01n' }
        ],
        clouds: { all: 3 },
        wind: { speed: 4.71, deg: 38 },
        sys: { pod: 'n' },
        dtText: '2022-03-06 21:00:00'
      },
      {
        dt: 1646643600,
        main: {
          temp: 4.78,
          feelsLike: 1.44,
          tempMin: 3.39,
          tempMax: 4.78,
          pressure: 1023,
          seaLevel: 1023,
          grndLevel: 1019,
          humidity: 56,
          tempKf: 1.39
        },
        weather: [
          { id: 800, main: 'Sunny', description: 'Ensoleillé', icon: '01n' }
        ],
        clouds: { all: 6 },
        wind: { speed: 4.26, deg: 41 },
        sys: { pod: 'n' },
        dtText: '2022-03-07 00:00:00'
      },
      {
        dt: 1646841600,
        main: {
          temp: 1.93,
          feelsLike: -1.6,
          tempMin: 1.93,
          tempMax: 1.93,
          pressure: 1023,
          seaLevel: 1023,
          grndLevel: 1018,
          humidity: 66,
          tempKf: 0
        },
        weather: [
          { id: 800, main: 'Cloudy', description: 'Nuageux', icon: '01n' }
        ],
        clouds: { all: 6 },
        wind: { speed: 3.54, deg: 39 },
        sys: { pod: 'n' },
        dtText: '2022-03-07 03:00:00'
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
    expect(spectator.component.getWidgetData()).toEqual(null);
    expect(spectator.component.isFormValid()).toEqual(false);
    const cityName = 'Paris';
    expect(spectator.component.cityData).toEqual(undefined);
    expect(spectator.component.forecastResponse).toEqual([]);
    expect(spectator.component.isWidgetLoaded()).toEqual(false);
    spectator.component.city = cityName;
    expect(spectator.component.isFormValid()).toEqual(true);
    expect(spectator.component.getWidgetData()).toEqual({ city: cityName });
    spectator.component.refreshWidget();

    const dataRequests = weatherWidgetService.expectConcurrent([
      {
        url:
          environment.backend_url + '/weatherWidget/weather?city=' + cityName,
        method: HttpMethod.GET
      },
      {
        url:
          environment.backend_url + '/weatherWidget/forecast?city=' + cityName,
        method: HttpMethod.GET
      }
    ]);

    weatherWidgetService.flushAll(dataRequests, [weatherData, forecastData]);

    expect(spectator.component.cityData?.name).toEqual(cityName);
    expect(spectator.component.forecastResponse.length).toEqual(
      forecastData.list.length
    );
    expect(spectator.component.isWidgetLoaded()).toEqual(true);

    if (spectator.component.cityData && spectator.component.weatherChart) {
      expect(spectator.component.weatherChart.datasets).toEqual([
        { borderColor: 'orange', data: [7.57, 6.76], label: 'Température' },
        { borderColor: 'red', data: [5.19, 3.67], label: 'Ressenti' }
      ]);
      spectator.component.selectDayForecast(
        new Date(spectator.component.forecastDays[0])
      );
      expect(
        spectator.component
          .filterForecastByMode(
            spectator.component.cityData,
            spectator.component.forecastResponse
          )
          .map((forecast) => format(new Date(forecast.dt * 1000), 'dd-MM-yyyy'))
      ).toEqual(['06-03-2022', '06-03-2022']);
      const dateToSelect = new Date(spectator.component.forecastDays[1]);
      spectator.component.selectDayForecast(dateToSelect);
      expect(spectator.component.isSelectedDay(dateToSelect)).toEqual(true);
      expect(
        spectator.component
          .filterForecastByMode(
            spectator.component.cityData,
            spectator.component.forecastResponse
          )
          .map((forecast) => format(new Date(forecast.dt * 1000), 'dd-MM-yyyy'))
      ).toEqual(['07-03-2022']);
      spectator.component.selectWeekForecast();
      expect(
        spectator.component
          .filterForecastByMode(
            spectator.component.cityData,
            spectator.component.forecastResponse
          )
          .map((forecast) => format(new Date(forecast.dt * 1000), 'dd-MM-yyyy'))
      ).toEqual(['09-03-2022']);
    }
  });

  it('Should format date', () => {
    const date = new Date(2022, 5, 1);
    expect(spectator.component.formatDate(date)).toEqual('01/06');
  });
});
