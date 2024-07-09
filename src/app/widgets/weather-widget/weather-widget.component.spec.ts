import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { format } from 'date-fns';
import { advanceTo } from 'jest-date-mock';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { WidgetService } from '../../services/widget.service/widget.service';
import { environment } from './../../../environments/environment';
import { ErrorHandlerService } from './../../services/error.handler.service';
import { IForecastAPIResponse } from './IWeather';
import { WeatherWidgetComponent } from './weather-widget.component';
import { WeatherWidgetService } from './weather.widget.service';
import { provideHttpClient } from '@angular/common/http';

describe('WeatherWidgetComponent', () => {
  let component: WeatherWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WeatherWidgetService,
        DateUtilsService,
        ErrorHandlerService,
        WidgetService,
        { provide: 'widgetId', useValue: 1 }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(WeatherWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  advanceTo(new Date(2022, 2, 6, 0, 0, 0)); // 06/03/2022

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
        weather: [{ id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01n' }],
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
        weather: [{ id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01n' }],
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
        weather: [{ id: 800, main: 'Sunny', description: 'Ensoleillé', icon: '01n' }],
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
        weather: [{ id: 800, main: 'Cloudy', description: 'Nuageux', icon: '01n' }],
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

  describe('Normal cases', () => {
    it('should create', () => {
      expect(component.getWidgetData()).toEqual(undefined);
      expect(component.isFormValid()).toEqual(false);
      const cityName = 'Paris';
      expect(component.cityData).toEqual(undefined);
      expect(component.forecastResponse).toEqual([]);
      expect(component.isWidgetLoaded()).toEqual(false);
      component.city = cityName;
      expect(component.isFormValid()).toEqual(true);
      expect(component.getWidgetData()).toEqual({ city: cityName });
      component.refreshWidget();

      const weatherRequest = httpTestingController.expectOne(
        environment.backend_url + '/weatherWidget/weather?city=' + cityName
      );
      weatherRequest.flush(weatherData);
      const forecastRequest = httpTestingController.expectOne(
        environment.backend_url + '/weatherWidget/forecast?city=' + cityName
      );
      forecastRequest.flush(forecastData);

      expect(component.cityData?.name).toEqual(cityName);
      expect(component.forecastResponse.length).toEqual(forecastData.list.length);
      expect(component.isWidgetLoaded()).toEqual(true);

      if (component.cityData) {
        expect(component.isForecastModeWeek()).toEqual(false);
        component.selectDayForecast(new Date(component.forecastDays[0]));
        const dateToSelect = new Date(component.forecastDays[1]);
        component.selectDayForecast(dateToSelect);
        expect(component.isSelectedDay(dateToSelect)).toEqual(true);
        // Select the same date a second time to check that nothing changes and to cover all possible cases
        component.selectDayForecast(dateToSelect);
        expect(component.isSelectedDay(dateToSelect)).toEqual(true);
        expect(
          component.forecastToDisplay.map((forecast) =>
            format(new Date(forecast.dt * 1000), 'dd-MM-yyyy')
          )
        ).toEqual(['07-03-2022']);
        component.selectWeekForecast();
        expect(component.isSelectedDay(dateToSelect)).toEqual(false);
        component.selectWeekForecast();
      }
    });

    it('Should format date', () => {
      const date = new Date(2022, 5, 1);
      expect(component.formatDate(date)).toEqual('mer. 01');
    });
  });

  describe('Error cases', () => {
    it('should display error messages', () => {
      const cityName = 'Paris';
      component.city = cityName;
      component.refreshWidget();

      httpTestingController
        .expectOne(environment.backend_url + '/weatherWidget/weather?city=' + cityName)
        .error(new ProgressEvent('Server error'));
      httpTestingController
        .expectOne(environment.backend_url + '/weatherWidget/forecast?city=' + cityName)
        .error(new ProgressEvent('Server error'));

      expect(component.weather).toEqual(undefined);
      expect(component.forecastResponse).toEqual([]);
    });
  });
});
