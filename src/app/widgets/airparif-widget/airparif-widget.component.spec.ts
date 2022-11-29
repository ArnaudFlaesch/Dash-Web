import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  createSpyObject,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';

import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { AirParifWidgetComponent } from './airparif-widget.component';
import { AirParifWidgetService } from './airparif-widget.service';
import { AirParifIndiceEnum } from './model/IAirParif';

describe('AirParifWidgetComponent', () => {
  let spectator: Spectator<AirParifWidgetComponent>;
  let airParifWidgetService: SpectatorHttp<AirParifWidgetService>;

  const communeInseeCode = '75112';
  const airParifToken = 'AIRPARIFTOKEN';

  const couleursIndicesData = [
    {
      name: 'BON',
      color: '#50f0e6'
    },
    {
      name: 'MOYEN',
      color: '#50ccaa'
    },
    {
      name: 'DEGRADE',
      color: '#f0e641'
    },
    {
      name: 'MAUVAIS',
      color: '#ff5050'
    },
    {
      name: 'TRES_MAUVAIS',
      color: '#960032'
    },
    {
      name: 'EXTREMEMENT_MAUVAIS',
      color: '#7d2181'
    }
  ];

  const forecastData = [
    {
      date: '2022-10-08',
      no2: 'MOYEN',
      o3: 'BON',
      pm10: 'BON',
      pm25: 'BON',
      so2: 'BON',
      indice: 'MOYEN'
    },
    {
      date: '2022-10-09',
      no2: 'MOYEN',
      o3: 'MOYEN',
      pm10: 'BON',
      pm25: 'MOYEN',
      so2: 'BON',
      indice: 'MOYEN'
    }
  ];

  const createComponent = createComponentFactory({
    component: AirParifWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [AirParifWidgetService, ErrorHandlerService]
  });
  const createHttpAirParifWidgetService = createHttpFactory(
    AirParifWidgetService
  );

  it('Should create an AirParif Widget', () => {
    spectator = createComponent();
    airParifWidgetService = createHttpAirParifWidgetService();

    expect(spectator.component.airParifApiKey).toEqual(undefined);
    expect(spectator.component.communeInseeCode).toEqual(undefined);
    expect(spectator.component.isFormValid()).toEqual(false);
    expect(spectator.component.getWidgetData()).toEqual(undefined);
    spectator.component.airParifApiKey = airParifToken;
    spectator.component.communeInseeCode = communeInseeCode;
    expect(spectator.component.isFormValid()).toEqual(true);
    expect(spectator.component.getWidgetData()).toEqual({
      airParifApiKey: airParifToken,
      communeInseeCode: communeInseeCode
    });

    expect(spectator.component.airParifForecast).toEqual([]);
    expect(spectator.component.airParifCouleursIndices).toEqual([]);

    spectator.component.refreshWidget();
    const dataRequests = airParifWidgetService.expectConcurrent([
      {
        url:
          environment.backend_url +
          '/airParifWidget/previsionCommune?commune=' +
          communeInseeCode,
        method: HttpMethod.GET
      },
      {
        url: environment.backend_url + '/airParifWidget/couleurs',
        method: HttpMethod.GET
      }
    ]);

    airParifWidgetService.flushAll(dataRequests, [
      forecastData,
      couleursIndicesData
    ]);

    expect(spectator.component.airParifForecast).toEqual(forecastData);
    expect(spectator.component.airParifCouleursIndices).toEqual(
      couleursIndicesData
    );

    expect(
      spectator.component.getColorFromIndice('BON' as AirParifIndiceEnum)
    ).toEqual('#50f0e6');
    expect(
      spectator.component.getColorFromIndice('null' as AirParifIndiceEnum)
    ).toEqual('');

    expect(spectator.component.isForecastModeToday()).toEqual(true);
    spectator.component.selectTomorrowForecast();
    expect(spectator.component.isForecastModeTomorrow()).toEqual(true);
    spectator.component.selectTodayForecast();
    expect(spectator.component.forecastToDisplay?.no2).toEqual('MOYEN');
  });

  it('should display error messages', () => {
    const errorHandlerService = createSpyObject(ErrorHandlerService);

    spectator = createComponent({
      providers: [
        { provide: ErrorHandlerService, useValue: errorHandlerService }
      ]
    });
    airParifWidgetService = createHttpAirParifWidgetService();

    spectator.component.airParifApiKey = airParifToken;
    spectator.component.communeInseeCode = communeInseeCode;
    spectator.component.refreshWidget();

    airParifWidgetService.controller
      .expectOne(
        environment.backend_url +
          '/airParifWidget/previsionCommune?commune=' +
          communeInseeCode,
        HttpMethod.GET
      )
      .error(new ProgressEvent('Server error'));
    airParifWidgetService.controller
      .expectOne(
        environment.backend_url + '/airParifWidget/couleurs',
        HttpMethod.GET
      )
      .error(new ProgressEvent('Server error'));

    expect(errorHandlerService.handleError).toHaveBeenCalledTimes(2);
  });
});
