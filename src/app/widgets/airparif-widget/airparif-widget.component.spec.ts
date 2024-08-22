import { MatSnackBarModule } from '@angular/material/snack-bar';

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { WidgetService } from '../../services/widget.service/widget.service';
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
      imports: [MatSnackBarModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AirParifWidgetService,
        ErrorHandlerService,
        WidgetService,
        { provide: 'widgetId', useValue: 1 }
      ]
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

    const requests = httpTestingController.match({
      method: 'GET'
    });
    requests[0].flush(forecastData);
    requests[1].flush(couleursIndicesData);

    expect(component.airParifForecast).toEqual(forecastData);
    expect(component.airParifCouleursIndices).toEqual(couleursIndicesData);
  });

  it('Should get errors from API', () => {
    component.airParifApiKey = airParifToken;
    component.communeInseeCode = communeInseeCode;
    expect(component.airParifForecast).toEqual([]);
    expect(component.airParifCouleursIndices).toEqual([]);
    component.refreshWidget();

    const requests = httpTestingController.match({
      method: 'GET'
    });
    requests[0].error(new ProgressEvent('Server error'));

    expect(component.airParifForecast).toEqual([]);
    expect(component.airParifCouleursIndices).toEqual([]);
  });
});
