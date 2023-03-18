import {
  createHostFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { WidgetListComponent } from './widget-list.component';
import { WeatherWidgetService } from '../weather-widget/weather.widget.service';
import { RssWidgetService } from '../rss-widget/rss.widget.service';
import { CalendarWidgetService } from '../calendar-widget/calendar-widget.service';
import { SteamWidgetService } from '../steam-widget/steam.widget.service';
import { StravaWidgetService } from '../strava-widget/strava.widget.service';
import { WorkoutWidgetService } from '../workout-widget/workout.widget.service';
import { AirParifWidgetService } from '../airparif-widget/airparif-widget.service';
import { WidgetService } from '../../services/widget.service/widget.service';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';

describe('WidgetListComponent', () => {
  let spectator: Spectator<WidgetListComponent>;
  let weatherWidgetService: SpectatorHttp<WeatherWidgetService>;
  let rssWidgetService: SpectatorHttp<RssWidgetService>;
  let calendarWidgetService: SpectatorHttp<CalendarWidgetService>;
  let stravaWidgetService: SpectatorHttp<StravaWidgetService>;
  let steamWidgetService: SpectatorHttp<SteamWidgetService>;
  let workoutWidgetService: SpectatorHttp<WorkoutWidgetService>;
  let airParifWidgetService: SpectatorHttp<AirParifWidgetService>;
  let widgetService: SpectatorHttp<WidgetService>;

  const createHost = createHostFactory({
    component: WidgetListComponent,
    providers: [WeatherWidgetService, ErrorHandlerService, DateUtilsService],
    imports: [MatSnackBarModule, MatDialogModule, RouterTestingModule]
  });
  const createWeatherHttp = createHttpFactory(WeatherWidgetService);
  const createRssHttp = createHttpFactory(RssWidgetService);
  const createCalendarHttp = createHttpFactory(CalendarWidgetService);
  const createStravaHttp = createHttpFactory(StravaWidgetService);
  const createSteamHttp = createHttpFactory(SteamWidgetService);
  const createWorkoutHttp = createHttpFactory(WorkoutWidgetService);
  const createAirParifHttp = createHttpFactory(AirParifWidgetService!);
  const createWidgetHttp = createHttpFactory(WidgetService);

  const widgetListConfig = [
    {
      id: 43,
      type: 1,
      widgetOrder: 1,
      tabId: 1
    },
    {
      id: 44,
      type: 2,

      widgetOrder: 2,
      tabId: 1
    },
    {
      id: 45,
      type: 3,
      widgetOrder: 3,
      tabId: 1
    },
    {
      id: 46,
      type: 4,
      widgetOrder: 4,
      tabId: 1
    },
    {
      id: 47,
      type: 5,
      widgetOrder: 5,
      tabId: 1
    },
    {
      id: 48,
      type: 6,
      widgetOrder: 6,
      tabId: 1
    },
    {
      id: 49,
      type: 7,
      widgetOrder: 7,
      tabId: 1
    }
  ];

  beforeEach(() => {
    spectator = createHost(`<app-widget-list [widgetList]="widgetList"></app-widget-list>`, {
      hostProps: {
        widgetList: widgetListConfig
      }
    });
    weatherWidgetService = createWeatherHttp();
    rssWidgetService = createRssHttp();
    calendarWidgetService = createCalendarHttp();
    stravaWidgetService = createStravaHttp();
    steamWidgetService = createSteamHttp();
    workoutWidgetService = createWorkoutHttp();
    airParifWidgetService = createAirParifHttp();
    widgetService = createWidgetHttp();
  });

  it('Should display the widgets', () => {
    expect(spectator.component.widgetList.length).toEqual(7);
  });
});
