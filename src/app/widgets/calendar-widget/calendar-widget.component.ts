import { ErrorHandlerService } from './../../services/error.handler.service';
import { CalendarWidgetService } from './calendar-widget.service';
import { Component, Inject, LOCALE_ID } from '@angular/core';
import { CalendarEvent, CalendarView, DateAdapter } from 'angular-calendar';
import { addMonths, endOfDay } from 'date-fns';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { EventDetailModalComponent } from './event-detail-modal/event-detail-modal.component';
import { ICalendarData } from './ICalendarData';

@Component({
  selector: 'app-calendar-widget',
  templateUrl: './calendar-widget.component.html',
  styleUrls: ['./calendar-widget.component.scss']
})
export class CalendarWidgetComponent {
  public calendarUrls: string[] = [];
  public isWidgetLoaded = false;

  calendarView = CalendarView;
  events: CalendarEvent[] = [];

  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  refresh: Subject<unknown> = new Subject();
  locale = 'fr';
  hourSegments: 1 | 2 | 4 | 6 = 1;
  weekStartsOn = 1;
  startsWithToday = true;
  activeDayIsOpen = true;
  excludeDays: number[] = [];
  weekendDays: number[] = [0, 6];
  dayStartHour = 6;
  dayEndHour = 24;

  minDate: Date = new Date();
  maxDate: Date = endOfDay(addMonths(new Date(), 1));

  prevBtnDisabled = false;
  nextBtnDisabled = false;

  private ERROR_PARSING_EVENTS = 'Erreur lors de la récupération des évènements.';

  constructor(
    @Inject(LOCALE_ID) locale: string,
    private dateAdapter: DateAdapter,
    public dialog: MatDialog,
    private calendarWidgetService: CalendarWidgetService,
    private errorHandlerService: ErrorHandlerService
  ) {
    this.locale = locale;
  }

  public refreshWidget() {
    this.events = [];
    this.calendarUrls.forEach((calendarUrl: string) => {
      this.calendarWidgetService.getCalendarEvents(calendarUrl).subscribe({
        next: (calendarData) => this.parseEvents(calendarData),
        error: (error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_PARSING_EVENTS),
        complete: () => (this.isWidgetLoaded = true)
      });
    });
  }

  private parseEvents(calendarData: ICalendarData[]) {
    const parsedEvents: CalendarEvent[] = calendarData
      .filter((event) => event.startDate && event.endDate && event.description)
      .map((event) => {
        return {
          title: event.description,
          start: new Date(event.startDate),
          end: new Date(event.endDate),
          allDay:
            new Date(event.endDate).getDay() === new Date(event.startDate).getDay() + 1 &&
            new Date(event.endDate).getHours() === new Date(event.startDate).getHours()
        };
      });
    this.events = [...this.events, ...parsedEvents];
  }

  public getWidgetConfig = (): { calendarUrls: string[] } | null =>
    this.calendarUrls && this.calendarUrls.length ? { calendarUrls: this.calendarUrls } : null;

  public onCalendarUrlAdded = () => (this.calendarUrls = [...this.calendarUrls, '']);
  public removeCalendarUrl = (calendarUrl: string) =>
    (this.calendarUrls = this.calendarUrls.filter((url) => url !== calendarUrl));

  public onCalendarUrlUpdated = (event: any) => {
    this.calendarUrls = this.calendarUrls.map((url: string, index: number) =>
      index.toString() === event.target?.id ? event.target.value : url
    );
  };

  public isFormValid = () => this.calendarUrls && this.calendarUrls.length > 0;

  public closeOpenMonthViewDay = () => (this.activeDayIsOpen = false);

  public setView = (view: CalendarView) => (this.view = view);

  public isCalendarViewMonth = () => this.view === CalendarView.Month;
  public isCalendarViewWeek = () => this.view === CalendarView.Week;
  public isCalendarViewDay = () => this.view === CalendarView.Day;

  public handleEvent(action: string, event: CalendarEvent): void {
    this.dialog.open(EventDetailModalComponent, {
      height: '300px',
      width: '500px',
      data: event
    });
  }
}
