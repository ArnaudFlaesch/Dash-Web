import { Component, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import {
  SchedulerDateFormatter,
  DAYS_IN_WEEK,
  CalendarSchedulerEvent,
  SchedulerViewHourSegment,
  SchedulerViewHour,
  SchedulerViewDay,
  SchedulerEventTimesChangedEvent,
  CalendarSchedulerViewComponent
} from 'angular-calendar-scheduler';
import { endOfDay, addMonths } from 'date-fns';
import { CalendarView, CalendarDateFormatter, DateAdapter } from 'angular-calendar';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-calendar-widget',
  templateUrl: './calendar-widget.component.html',
  styleUrls: ['./calendar-widget.component.scss'],
  providers: [
    {
      provide: CalendarDateFormatter,
      useClass: SchedulerDateFormatter
    }
  ]
})
export class CalendarWidgetComponent {
  public calendarUrls: string[] | null = null;

  CalendarView = CalendarView;

  view: CalendarView = CalendarView.Week;
  viewDate: Date = new Date();
  viewDays: number = DAYS_IN_WEEK;
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

  dayModifier: (day: SchedulerViewDay) => void;
  hourModifier: (hour: SchedulerViewHour) => void;
  segmentModifier: (segment: SchedulerViewHourSegment) => void;
  eventModifier: (event: CalendarSchedulerEvent) => void;

  prevBtnDisabled = false;
  nextBtnDisabled = false;
  events: CalendarSchedulerEvent[] = [];

  @ViewChild(CalendarSchedulerViewComponent) calendarScheduler:
    | CalendarSchedulerViewComponent
    | undefined;

  constructor(@Inject(LOCALE_ID) locale: string, private dateAdapter: DateAdapter) {
    this.locale = locale;
    this.dayModifier = ((day: SchedulerViewDay): void => {
      if (!this.isDateValid(day.date)) {
        day.cssClass = 'cal-disabled';
      }
    }).bind(this);

    this.hourModifier = ((hour: SchedulerViewHour): void => {
      if (!this.isDateValid(hour.date)) {
        hour.cssClass = 'cal-disabled';
      }
    }).bind(this);

    this.segmentModifier = ((segment: SchedulerViewHourSegment): void => {
      if (!this.isDateValid(segment.date)) {
        segment.isDisabled = true;
      }
    }).bind(this);

    this.eventModifier = ((event: CalendarSchedulerEvent): void => {
      event.isDisabled = !this.isDateValid(event.start);
    }).bind(this);
  }

  public refreshWidget() {}

  private isDateValid(date: Date): boolean {
    return /*isToday(date) ||*/ date >= this.minDate && date <= this.maxDate;
  }

  viewDaysChanged(viewDays: number): void {
    console.log('viewDaysChanged', viewDays);
    this.viewDays = viewDays;
  }

  dayHeaderClicked(day: SchedulerViewDay): void {
    console.log('dayHeaderClicked Day', day);
  }

  hourClicked(hour: SchedulerViewHour): void {
    console.log('hourClicked Hour', hour);
  }

  segmentClicked(action: string, segment: SchedulerViewHourSegment): void {
    console.log('segmentClicked Action', action);
    console.log('segmentClicked Segment', segment);
  }

  eventClicked(action: string, event: CalendarSchedulerEvent): void {
    console.log('eventClicked Action', action);
    console.log('eventClicked Event', event);
  }

  eventTimesChanged({ event, newStart, newEnd }: SchedulerEventTimesChangedEvent): void {
    console.log('eventTimesChanged Event', event);
    console.log('eventTimesChanged New Times', newStart, newEnd);
    const ev = this.events.find((e) => e.id === event.id);
    if (ev) {
      ev.start = newStart;
      ev.end = newEnd;
    }
    this.refresh.next(null);
  }

  public getWidgetConfig = (): { calendarUrls: string[] } | null =>
    this.calendarUrls ? { calendarUrls: this.calendarUrls } : null;

  public onCalendarUrlAdded = () => null; // this.calendarUrls.push('');
  public removeCalendarUrl = (calendarUrl: string) => null; //  (this.calendarUrls = this.calendarUrls.filter((url) => url !== calendarUrl));

  public onCalendarUrlUpdated = (event: any) => {
    null;
    //  this.calendarUrls = this.calendarUrls.map((url: string, index: number) =>
    //  index.toString() === event.target?.id ? event.target.value : url
    // );
  };
}
