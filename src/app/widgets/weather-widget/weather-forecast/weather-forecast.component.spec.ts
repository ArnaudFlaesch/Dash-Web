import { TestBed } from '@angular/core/testing';
import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { WeatherWidgetService } from '../weather.widget.service';
import { WeatherForecastComponent } from './weather-forecast.component';

describe('WeatherForecastComponent', () => {
  let component: WeatherForecastComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      providers: [WeatherWidgetService, DateUtilsService]
    }).compileComponents();

    const fixture = TestBed.createComponent(WeatherForecastComponent);
    component = fixture.componentInstance;
  });

  it('Should get weather icons', () => {
    const icon = 'sunny';
    expect(component.getIconFromWeatherApi(icon)).toEqual(
      `https://openweathermap.org/img/wn/${icon}@2x.png`
    );
  });
});
