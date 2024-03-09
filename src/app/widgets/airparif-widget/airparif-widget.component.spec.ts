import { MatSnackBarModule } from '@angular/material/snack-bar';
import { createSpyObject, HttpMethod } from '@ngneat/spectator/jest';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { AirParifWidgetComponent } from './airparif-widget.component';
import { AirParifWidgetService } from './airparif-widget.service';

describe('AirParifWidgetComponent', () => {
  let component: AirParifWidgetComponent;
  let httpTestingController: HttpTestingController;

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatSnackBarModule],
      providers: [AirParifWidgetService, ErrorHandlerService]
    }).compileComponents();

    const fixture = TestBed.createComponent(AirParifWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('Should create an AirParif Widget', () => {
    expect(component.airParifApiKey).toEqual(undefined);
    expect(component.communeInseeCode).toEqual(undefined);
    expect(component.isFormValid()).toEqual(false);
    expect(component.getWidgetData()).toEqual(undefined);
    component.airParifApiKey = airParifToken;
    component.communeInseeCode = communeInseeCode;
    expect(component.isFormValid()).toEqual(true);
    const widgetData = component.getWidgetData();
    expect(widgetData?.airParifApiKey).toBe(airParifToken);
    expect(widgetData?.communeInseeCode).toBe(communeInseeCode);
    expect(component.airParifForecast).toEqual([]);
    expect(component.airParifCouleursIndices).toEqual([]);

    component.refreshWidget();
    const dataRequests = httpTestingController.expectConcurrent([
      {
        url:
          environment.backend_url + '/airParifWidget/previsionCommune?commune=' + communeInseeCode,
        method: HttpMethod.GET
      },
      {
        url: environment.backend_url + '/airParifWidget/couleurs',
        method: HttpMethod.GET
      }
    ]);

    httpTestingController.flushAll(dataRequests, [forecastData, couleursIndicesData]);

    expect(component.airParifForecast).toEqual(forecastData);
    expect(component.airParifCouleursIndices).toEqual(couleursIndicesData);
  });

  it('should display error messages', () => {
    const errorHandlerService = createSpyObject(ErrorHandlerService);

    spectator = createComponent({
      providers: [{ provide: ErrorHandlerService, useValue: errorHandlerService }]
    });

    component.airParifApiKey = airParifToken;
    component.communeInseeCode = communeInseeCode;
    component.refreshWidget();

    httpTestingController
      .expectOne(
        environment.backend_url + '/airParifWidget/previsionCommune?commune=' + communeInseeCode,
        HttpMethod.GET
      )
      .error(new ProgressEvent('Server error'));

    httpTestingController
      .expectOne(environment.backend_url + '/airParifWidget/couleurs', HttpMethod.GET)
      .error(new ProgressEvent('Server error'));

    expect(errorHandlerService.handleError).toHaveBeenCalledTimes(2);
  });
});
