import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';

import { TestBed } from '@angular/core/testing';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { ThemeService } from '../../services/theme.service/theme.service';
import { WidgetService } from '../../services/widget.service/widget.service';
import { AirParifWidgetService } from '../airparif-widget/airparif-widget.service';
import { CalendarWidgetService } from '../calendar-widget/calendar-widget.service';
import { IncidentWidgetService } from '../incident-widget/incident.widget.service';
import { RssWidgetService } from '../rss-widget/rss.widget.service';
import { SteamWidgetService } from '../steam-widget/steam.widget.service';
import { StravaWidgetService } from '../strava-widget/strava.widget.service';
import { WeatherWidgetService } from '../weather-widget/weather.widget.service';
import { WorkoutWidgetService } from '../workout-widget/workout.widget.service';
import { WidgetListComponent } from './widget-list.component';

describe('WidgetListComponent', () => {
  let component: WidgetListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule, MatDialogModule, HttpClientTestingModule, RouterTestingModule],
      providers: [
        RssWidgetService,
        SteamWidgetService,
        StravaWidgetService,
        AirParifWidgetService,
        WeatherWidgetService,
        CalendarWidgetService,
        WorkoutWidgetService,
        IncidentWidgetService,
        ErrorHandlerService,
        WidgetService,
        ThemeService,
        DateUtilsService
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(WidgetListComponent);
    component = fixture.componentInstance;
  });

  it('Should display the widgets', () => {
    expect(component).toBeTruthy();
  });
});
