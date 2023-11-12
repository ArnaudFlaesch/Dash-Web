import { Component, Inject, LOCALE_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { addMonths, endOfDay, format, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Subject } from 'rxjs';

import { ErrorHandlerService } from './../../services/error.handler.service';
import { CalendarWidgetService } from './calendar-widget.service';
import { EventDetailModalComponent } from './event-detail-modal/event-detail-modal.component';
import { ICalendarData } from './ICalendarData';

@Component({
  selector: 'app-calendar-widget',
  templateUrl: './calendar-widget.component.html',
  styleUrls: ['./calendar-widget.component.scss']
})
export class CalendarWidgetComponent {
  public calendarUrls: string[] = [];
  public isWidgetLoaded = true;

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

  private readonly MILLISECONDS_IN_A_DAY = 86400000;
  private ERROR_PARSING_EVENTS = 'Erreur lors de la récupération des évènements.';

  constructor(
    @Inject(LOCALE_ID) locale: string,
    public dialog: MatDialog,
    private calendarWidgetService: CalendarWidgetService,
    private errorHandlerService: ErrorHandlerService
  ) {
    this.locale = locale;
  }

  public refreshWidget(): void {
    this.events = [];
    this.calendarUrls.forEach((calendarUrl: string) => {
      this.calendarWidgetService.getCalendarEvents(calendarUrl).subscribe({
        next: (calendarData) => {
          this.events = [...this.events, ...this.parseEvents(calendarData)];
          this.isWidgetLoaded = true;
        },
        error: (error) => this.errorHandlerService.handleError(error, this.ERROR_PARSING_EVENTS)
      });
    });
  }

  public getWidgetConfig(): { calendarUrls: string[] } | undefined {
    return this.calendarUrls?.length ? { calendarUrls: this.calendarUrls } : undefined;
  }

  public onCalendarUrlAdded(): void {
    this.calendarUrls = [...this.calendarUrls, ''];
  }

  public removeCalendarUrl(calendarUrl: string): void {
    this.calendarUrls = this.calendarUrls.filter((url) => url !== calendarUrl);
  }

  public onCalendarUrlUpdated(event: Event): void {
    this.calendarUrls = this.calendarUrls.map((url: string, index: number) => {
      const eventTarget = event.target as HTMLInputElement;
      return index.toString() === eventTarget?.id ? eventTarget.value : url;
    });
  }

  public isFormValid(): boolean {
    return this.calendarUrls && this.calendarUrls.length > 0;
  }

  public closeOpenMonthViewDay(): void {
    this.activeDayIsOpen = false;
  }

  public setView(view: CalendarView): void {
    this.view = view;
  }

  public isCalendarViewMonth(): boolean {
    return this.view === CalendarView.Month;
  }

  public isCalendarViewWeek(): boolean {
    return this.view === CalendarView.Week;
  }

  public isCalendarViewDay(): boolean {
    return this.view === CalendarView.Day;
  }

  public handleEvent(action: string, event: CalendarEvent): void {
    this.dialog.open(EventDetailModalComponent, {
      height: '300px',
      width: '500px',
      data: event
    });
  }

  private parseEvents(calendarData: ICalendarData[]): CalendarEvent[] {
    return calendarData
      .filter((event) => event.startDate && event.endDate && event.description)
      .map((event) => {
        let startDate = new Date(event.startDate);
        let endDate = new Date(event.endDate);
        const isAllDay = endDate.getTime() - startDate.getTime() === this.MILLISECONDS_IN_A_DAY;
        if (
          endDate.getHours() + endDate.getTimezoneOffset() / 60 === 0 &&
          endDate.getMinutes() === 0
        ) {
          endDate = endOfDay(new Date(endDate.getTime() - this.MILLISECONDS_IN_A_DAY));
        }
        if (
          startDate.getHours() + startDate.getTimezoneOffset() / 60 === 0 &&
          startDate.getMinutes() === 0
        ) {
          startDate = startOfDay(startDate);
        }

        return {
          title: event.description,
          start: startDate,
          end: endDate,
          allDay: isAllDay
        };
      });
  }
}
