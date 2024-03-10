import { TestBed } from '@angular/core/testing';
import { DateUtilsService } from '../../../services/date.utils.service/date.utils.service';
import { WeatherWidgetService } from '../weather.widget.service';
import { WeatherTodayComponent } from './weather-today.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('WeatherTodayComponent', () => {
  let component: WeatherTodayComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WeatherWidgetService, DateUtilsService]
    }).compileComponents();

    const fixture = TestBed.createComponent(WeatherTodayComponent);
    component = fixture.componentInstance;
  });

  it('Should get weather icons', () => {
    const icon = 'sunny';
    expect(component.getIconFromWeatherApi(icon)).toEqual(
      `https://openweathermap.org/img/wn/${icon}@2x.png`
    );
  });
});
