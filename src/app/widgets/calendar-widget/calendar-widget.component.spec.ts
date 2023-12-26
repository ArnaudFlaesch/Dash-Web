import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { CalendarView, DateAdapter } from 'angular-calendar';

import { environment } from '../../../environments/environment';
import { DateUtilsService } from '../../services/date.utils.service/date.utils.service';
import { ErrorHandlerService } from './../../services/error.handler.service';
import { CalendarWidgetComponent } from './calendar-widget.component';
import { CalendarWidgetService } from './calendar-widget.service';

describe('CalendarWidgetComponent', () => {
  let spectator: Spectator<CalendarWidgetComponent>;
  let calendarWidgetService: SpectatorHttp<CalendarWidgetService>;

  const createComponent = createComponentFactory({
    component: CalendarWidgetComponent,
    imports: [MatDialogModule, MatSnackBarModule],
    providers: [CalendarWidgetService, DateAdapter, DateUtilsService, ErrorHandlerService]
  });
  const createHttpCalendarWidgetService = createHttpFactory(CalendarWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    calendarWidgetService = createHttpCalendarWidgetService();
  });

  it('should create', () => {
    expect(spectator.component.calendarUrls).toEqual([]);
    spectator.component.refreshWidget();
    expect(spectator.component.events).toEqual([]);
    expect(spectator.component.isCalendarViewMonth()).toEqual(true);
    spectator.component.calendarUrls.push('https://calendar.ical');
    spectator.component.refreshWidget();
    const getCalendarDataRequest = calendarWidgetService.expectOne(
      environment.backend_url + `/calendarWidget/`,
      HttpMethod.POST
    );
    const getCalendarData = [
      {
        startDate: '2022-11-01T00:00:00.000+00:00',
        endDate: '2022-11-02T00:00:00.000+00:00',
        description: 'La Toussaint'
      },
      {
        startDate: '2021-05-23T00:00:00.000+00:00',
        endDate: '2021-05-24T00:00:00.000+00:00',
        description: 'Pentecôte'
      },
      {
        startDate: '2022-12-25T00:00:00.000+00:00',
        endDate: '2022-12-26T00:00:00.000+00:00',
        description: 'Noël'
      },
      {
        startDate: '2023-12-24T00:00:00.000+00:00',
        endDate: '2023-12-25T00:00:00.000+00:00',
        description: 'La veille de Noël'
      },
      {
        startDate: '2021-11-01T00:00:00.000+00:00',
        endDate: '2021-11-02T00:00:00.000+00:00',
        description: 'La Toussaint'
      },
      {
        startDate: '2022-07-14T00:00:00.000+00:00',
        endDate: '2022-07-15T00:00:00.000+00:00',
        description: 'La fête nationale'
      }
    ];
    getCalendarDataRequest.flush(getCalendarData);
    expect(spectator.component.events.length).toEqual(6);
    const calendarEvent = spectator.component.events[0];
    expect(calendarEvent.title).toEqual('La Toussaint');
  });

  it('Should check actual view', () => {
    spectator.component.setView(CalendarView.Day);
    expect(spectator.component.isCalendarViewMonth()).toEqual(false);
    expect(spectator.component.isCalendarViewWeek()).toEqual(false);
    expect(spectator.component.isCalendarViewDay()).toEqual(true);
  });

  it('Should update the calendar urls', () => {
    expect(spectator.component.calendarUrls).toEqual([]);
    expect(spectator.component.getWidgetConfig()).toEqual(undefined);
    spectator.component.onCalendarUrlAdded();
    expect(spectator.component.calendarUrls).toEqual(['']);
    expect(spectator.component.getWidgetConfig()).toEqual({ calendarUrls: [''] });
    spectator.component.removeCalendarUrl('');
    expect(spectator.component.getWidgetConfig()).toEqual(undefined);
  });
});
