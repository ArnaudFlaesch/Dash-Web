import { environment } from './../../../../environments/environment';

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { ErrorHandlerService } from '../../../services/error.handler.service';
import { WeatherWidgetService } from '../weather.widget.service';
import { WeatherMiniWidgetComponent } from './weather-miniwidget.component';
import { WidgetService } from '../../../services/widget.service/widget.service';
import { MiniWidgetService } from '../../../services/widget.service/miniwidget.service';

describe('WeatherMiniWidgetComponent', () => {
  let component: WeatherMiniWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule, HttpClientTestingModule],
      providers: [
        WeatherWidgetService,
        DateUtilsService,
        ErrorHandlerService,
        WidgetService,
        MiniWidgetService,
        { provide: 'widgetId', useValue: 1 }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(WeatherMiniWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('Should create widget', () => {
    expect(component.getWidgetData()).toEqual(undefined);
    expect(component.isFormValid()).toEqual(false);
    expect(component.isWidgetLoaded()).toEqual(false);

    const city = 'Paris';
    component.city = city;

    expect(component.getWidgetData()).toEqual({ city: city });
    expect(component.isFormValid()).toEqual(true);

    component.refreshWidget();

    const request = httpTestingController.expectOne(
      environment.backend_url + '/weatherWidget/weather?city=' + city
    );

    request.flush({});

    expect(component.isWidgetLoaded()).toEqual(true);
  });

  it('Should get weather icons', () => {
    const icon = 'sunny';
    expect(component.getIconFromWeatherApi(icon)).toEqual(
      `https://openweathermap.org/img/wn/${icon}@2x.png`
    );
  });
});
