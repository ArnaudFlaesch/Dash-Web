import { Component, Inject, LOCALE_ID } from '@angular/core';
import { CalendarEvent, CalendarView, DateAdapter } from 'angular-calendar';
import { addMonths, endOfDay } from 'date-fns';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-calendar-widget',
  templateUrl: './calendar-widget.component.html',
  styleUrls: ['./calendar-widget.component.scss']
})
export class CalendarWidgetComponent {
  public calendarUrls: string[] = [];

  CalendarView = CalendarView;
  events: CalendarEvent[] = [];

  view: CalendarView = CalendarView.Week;
  viewDate: Date = new Date();
  refresh: Subject<any> = new Subject();
  locale = 'fr';
  hourSegments: 1 | 2 | 4 | 6 = 1;
  weekStartsOn = 1;
  startsWithToday = true;
  activeDayIsOpen = true;
  excludeDays: number[] = []; // [0];
  weekendDays: number[] = [0, 6];
  dayStartHour = 6;
  dayEndHour = 22;

  minDate: Date = new Date();
  maxDate: Date = endOfDay(addMonths(new Date(), 1));

  prevBtnDisabled = false;
  nextBtnDisabled = false;

  constructor(@Inject(LOCALE_ID) locale: string, private dateAdapter: DateAdapter) {
    this.locale = locale;
  }

  public refreshWidget() {
    console.log('refresh calendar');
  }

  private isDateValid(date: Date): boolean {
    return /*isToday(date) ||*/ date >= this.minDate && date <= this.maxDate;
  }

  public getWidgetConfig = (): { calendarUrls: string[] } | null =>
    this.calendarUrls ? { calendarUrls: this.calendarUrls } : null;

  public onCalendarUrlAdded = () => (this.calendarUrls = [...this.calendarUrls, '']);
  public removeCalendarUrl = (calendarUrl: string) => null; //  (this.calendarUrls = this.calendarUrls.filter((url) => url !== calendarUrl));

  public onCalendarUrlUpdated = (event: any) => {
    null;
    //  this.calendarUrls = this.calendarUrls.map((url: string, index: number) =>
    //  index.toString() === event.target?.id ? event.target.value : url
    // );
  };

  public isFormValid = () => this.calendarUrls.length > 0;

  public closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }

  public setView(view: CalendarView) {
    this.view = view;
  }

  public handleEvent(action: string, event: CalendarEvent): void {}
}
