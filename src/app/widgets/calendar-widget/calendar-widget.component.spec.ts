import { MatDialogModule } from '@angular/material/dialog';
import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator';
import { CalendarView, DateAdapter } from 'angular-calendar';
import { environment } from '../../../environments/environment';
import { CalendarWidgetComponent } from './calendar-widget.component';
import { CalendarWidgetService } from './calendar-widget.service';

describe('CalendarWidgetComponent', () => {
  let spectator: Spectator<CalendarWidgetComponent>;
  let calendarWidgetService: SpectatorHttp<CalendarWidgetService>;

  const createComponent = createComponentFactory({
    component: CalendarWidgetComponent,
    imports: [MatDialogModule],
    providers: [CalendarWidgetService, DateAdapter]
  });
  const createHttpRssWidgetService = createHttpFactory(CalendarWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    calendarWidgetService = createHttpRssWidgetService();
  });

  it('should create', () => {
    expect(spectator.component.calendarUrls).toEqual([]);
    spectator.component.refreshWidget();
    expect(spectator.component.events).toEqual([]);
    expect(spectator.component.isCalendarViewMonth()).toEqual(true);
    spectator.component.calendarUrls.push('http://calendar.ical');
    spectator.component.refreshWidget();
    const getCalendarDataRequest = calendarWidgetService.expectOne(
      environment.backend_url + `/calendarWidget/`,
      HttpMethod.POST
    );
    const getCalendarData = {
      properties: [
        {
          name: 'PRODID',
          parameters: {
            empty: true
          },
          value: '-//Google Inc//Google Calendar 70.9054//EN',
          calendarProperty: true
        },
        {
          name: 'VERSION',
          parameters: {
            empty: true
          },
          minVersion: null,
          maxVersion: '2.0',
          value: '2.0',
          calendarProperty: true
        },
        {
          name: 'CALSCALE',
          parameters: {
            empty: true
          },
          value: 'GREGORIAN',
          calendarProperty: true
        },
        {
          name: 'METHOD',
          parameters: {
            empty: true
          },
          value: 'PUBLISH',
          calendarProperty: true
        },
        {
          name: 'X-WR-CALNAME',
          parameters: {
            empty: true
          },
          value: 'Jours fériés en France',
          calendarProperty: false
        },
        {
          name: 'X-WR-TIMEZONE',
          parameters: {
            empty: true
          },
          value: 'UTC',
          calendarProperty: false
        },
        {
          name: 'X-WR-CALDESC',
          parameters: {
            empty: true
          },
          value: 'Jours fériés et fêtes légales en France',
          calendarProperty: false
        }
      ],
      components: [
        {
          name: 'VEVENT',
          properties: [
            {
              name: 'DTSTART',
              parameters: {
                empty: false
              },
              date: 1667260800000,
              timeZone: null,
              value: '20221101',
              utc: false,
              calendarProperty: false
            },
            {
              name: 'DTEND',
              parameters: {
                empty: false
              },
              date: 1667347200000,
              timeZone: null,
              value: '20221102',
              utc: false,
              calendarProperty: false
            },
            {
              name: 'DTSTAMP',
              parameters: {
                empty: true
              },
              date: 1647968856000,
              timeZone: null,
              dateTime: 1647968856000,
              value: '20220322T170736Z',
              utc: true,
              calendarProperty: false
            },
            {
              name: 'UID',
              parameters: {
                empty: true
              },
              value: '20221101_2c3kflc4jarsvbht100d2j89fg@google.com',
              calendarProperty: false
            },
            {
              name: 'CLASS',
              parameters: {
                empty: true
              },
              value: 'PUBLIC',
              calendarProperty: false
            },
            {
              name: 'CREATED',
              parameters: {
                empty: true
              },
              date: 1629967361000,
              timeZone: null,
              dateTime: 1629967361000,
              value: '20210826T084241Z',
              utc: true,
              calendarProperty: false
            },
            {
              name: 'DESCRIPTION',
              parameters: {
                empty: true
              },
              value: 'Jour férié',
              calendarProperty: false
            },
            {
              name: 'LAST-MODIFIED',
              parameters: {
                empty: true
              },
              date: 1629967361000,
              timeZone: null,
              dateTime: 1629967361000,
              value: '20210826T084241Z',
              utc: true,
              calendarProperty: false
            },
            {
              name: 'SEQUENCE',
              parameters: {
                empty: true
              },
              sequenceNo: 0,
              value: '0',
              calendarProperty: false
            },
            {
              name: 'STATUS',
              parameters: {
                empty: true
              },
              value: 'CONFIRMED',
              calendarProperty: false
            },
            {
              name: 'SUMMARY',
              parameters: {
                empty: true
              },
              value: 'La Toussaint',
              calendarProperty: false
            },
            {
              name: 'TRANSP',
              parameters: {
                empty: true
              },
              value: 'TRANSPARENT',
              calendarProperty: false
            }
          ],
          alarms: [],
          location: null,
          priority: null,
          duration: null,
          lastModified: {
            name: 'LAST-MODIFIED',
            parameters: {
              empty: true
            },
            date: 1629967361000,
            timeZone: null,
            dateTime: 1629967361000,
            value: '20210826T084241Z',
            utc: true,
            calendarProperty: false
          },
          summary: {
            name: 'SUMMARY',
            parameters: {
              empty: true
            },
            value: 'La Toussaint',
            calendarProperty: false
          },
          classification: {
            name: 'CLASS',
            parameters: {
              empty: true
            },
            value: 'PUBLIC',
            calendarProperty: false
          },
          geographicPos: null,
          organizer: null,
          dateStamp: {
            name: 'DTSTAMP',
            parameters: {
              empty: true
            },
            date: 1647968856000,
            timeZone: null,
            dateTime: 1647968856000,
            value: '20220322T170736Z',
            utc: true,
            calendarProperty: false
          },
          transparency: {
            name: 'TRANSP',
            parameters: {
              empty: true
            },
            value: 'TRANSPARENT',
            calendarProperty: false
          },
          recurrenceId: null,
          sequence: {
            name: 'SEQUENCE',
            parameters: {
              empty: true
            },
            sequenceNo: 0,
            value: '0',
            calendarProperty: false
          },
          url: null,
          description: {
            name: 'DESCRIPTION',
            parameters: {
              empty: true
            },
            value: 'Jour férié',
            calendarProperty: false
          },
          startDate: {
            name: 'DTSTART',
            parameters: {
              empty: false
            },
            date: 1667260800000,
            timeZone: null,
            value: '20221101',
            utc: false,
            calendarProperty: false
          },
          endDate: {
            name: 'DTEND',
            parameters: {
              empty: false
            },
            date: 1667347200000,
            timeZone: null,
            value: '20221102',
            utc: false,
            calendarProperty: false
          },
          uid: {
            name: 'UID',
            parameters: {
              empty: true
            },
            value: '20221101_2c3kflc4jarsvbht100d2j89fg@google.com',
            calendarProperty: false
          },
          status: {
            name: 'STATUS',
            parameters: {
              empty: true
            },
            value: 'CONFIRMED',
            calendarProperty: false
          },
          created: {
            name: 'CREATED',
            parameters: {
              empty: true
            },
            date: 1629967361000,
            timeZone: null,
            dateTime: 1629967361000,
            value: '20210826T084241Z',
            utc: true,
            calendarProperty: false
          }
        }
      ],
      method: {
        name: 'METHOD',
        parameters: {
          empty: true
        },
        value: 'PUBLISH',
        calendarProperty: true
      },
      version: {
        name: 'VERSION',
        parameters: {
          empty: true
        },
        minVersion: null,
        maxVersion: '2.0',
        value: '2.0',
        calendarProperty: true
      },
      productId: {
        name: 'PRODID',
        parameters: {
          empty: true
        },
        value: '-//Google Inc//Google Calendar 70.9054//EN',
        calendarProperty: true
      },
      calendarScale: {
        name: 'CALSCALE',
        parameters: {
          empty: true
        },
        value: 'GREGORIAN',
        calendarProperty: true
      }
    };
    getCalendarDataRequest.flush(getCalendarData);
    expect(spectator.component.events.length).toEqual(1);
    const calendarEvent = spectator.component.events[0];
    expect(calendarEvent.title).toEqual('La Toussaint');
  });
});
