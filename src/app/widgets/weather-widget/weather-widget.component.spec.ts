import { DateUtilsService } from './../../utils/DateUtils';
import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator';
import { WeatherWidgetComponent } from './weather-widget.component';
import { WeatherWidgetService } from './weather.widget.service';

describe('WeatherWidgetComponent', () => {
  let spectator: Spectator<WeatherWidgetComponent>;
  let weatherWidgetService: SpectatorHttp<WeatherWidgetService>;

  const createComponent = createComponentFactory({
    component: WeatherWidgetComponent,
    providers: [WeatherWidgetService, DateUtilsService]
  });
  const createHttp = createHttpFactory(WeatherWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    weatherWidgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
