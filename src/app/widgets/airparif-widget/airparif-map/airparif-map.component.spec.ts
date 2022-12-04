import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';

import { AirParifWidgetService } from '../airparif-widget.service';
import {
  AirParifIndiceEnum,
  IForecast,
  IAirParifCouleur
} from '../model/IAirParif';
import { AirParifMapComponent } from './airparif-map.component';

describe('AirParifMapComponent', () => {
  let spectator: Spectator<AirParifMapComponent>;
  let airParifWidgetService: SpectatorHttp<AirParifWidgetService>;

  const createComponent = createComponentFactory({
    component: AirParifMapComponent,
    imports: [],
    providers: [AirParifWidgetService]
  });
  const createHttpAirParifWidgetService = createHttpFactory(
    AirParifWidgetService
  );

  it('Should create an AirParif map', () => {
    spectator = createComponent();
    airParifWidgetService = createHttpAirParifWidgetService();

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
    ] as unknown as IAirParifCouleur[];

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
    ] as unknown as IForecast[];

    spectator.component.airParifForecast = forecastData;
    spectator.component.airParifCouleursIndices = couleursIndicesData;

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
});
