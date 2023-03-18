import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { createHostFactory, Spectator } from '@ngneat/spectator/jest';

import { WidgetTypeEnum } from '../../enums/WidgetTypeEnum';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { WidgetService } from '../../services/widget.service/widget.service';
import { AirParifWidgetService } from '../airparif-widget/airparif-widget.service';
import { CalendarWidgetService } from '../calendar-widget/calendar-widget.service';
import { RssWidgetService } from '../rss-widget/rss.widget.service';
import { SteamWidgetService } from '../steam-widget/steam.widget.service';
import { StravaWidgetService } from '../strava-widget/strava.widget.service';
import { TwitterWidgetService } from '../twitter-widget/twitter.widget.service';
import { WeatherWidgetService } from '../weather-widget/weather.widget.service';
import { WorkoutWidgetService } from '../workout-widget/workout.widget.service';
import { WidgetListComponent } from './widget-list.component';

describe('WidgetListComponent', () => {
  let spectator: Spectator<WidgetListComponent>;

  const createHost = createHostFactory({
    component: WidgetListComponent,
    providers: [
      RssWidgetService,
      SteamWidgetService,
      StravaWidgetService,
      AirParifWidgetService,
      WeatherWidgetService,
      TwitterWidgetService,
      CalendarWidgetService,
      WorkoutWidgetService,
      ErrorHandlerService,
      WidgetService,
      DateUtilsService
    ],
    imports: [MatSnackBarModule, MatDialogModule, HttpClientTestingModule, RouterTestingModule]
  });

  const widgetListConfig = [
    {
      id: 43,
      type: WidgetTypeEnum.WEATHER,
      widgetOrder: 1,
      tabId: 1
    },
    {
      id: 44,
      type: WidgetTypeEnum.RSS,
      widgetOrder: 2,
      tabId: 1
    },
    {
      id: 45,
      type: 3,
      widgetOrder: WidgetTypeEnum.CALENDAR,
      tabId: 1
    },
    {
      id: 46,
      type: WidgetTypeEnum.STRAVA,
      widgetOrder: 4,
      tabId: 1
    },
    {
      id: 47,
      type: WidgetTypeEnum.STEAM,
      widgetOrder: 5,
      tabId: 1
    },
    {
      id: 48,
      type: WidgetTypeEnum.WORKOUT,
      widgetOrder: 6,
      tabId: 1
    },
    {
      id: 49,
      type: WidgetTypeEnum.AIRPARIF,
      widgetOrder: 7,
      tabId: 1
    },
    {
      id: 50,
      type: WidgetTypeEnum.TWITTER,
      widgetOrder: 8,
      tabId: 1
    },
    {
      id: 51,
      type: WidgetTypeEnum.ECOWATT,
      widgetOrder: 9,
      tabId: 1
    }
  ];

  beforeEach(() => {
    spectator = createHost(`<app-widget-list [widgetList]="widgetList"></app-widget-list>`, {
      hostProps: {
        widgetList: widgetListConfig
      }
    });
  });

  it('Should display the widgets', () => {
    expect(spectator.component.widgetList.length).toEqual(9);
  });
});
