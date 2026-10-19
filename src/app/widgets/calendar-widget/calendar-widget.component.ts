import { Component, computed, inject, LOCALE_ID, signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import {
  CalendarDatePipe,
  CalendarDayViewComponent,
  CalendarEvent,
  CalendarMonthViewComponent,
  CalendarNextViewDirective,
  CalendarPreviousViewDirective,
  CalendarTodayDirective,
  CalendarView,
  CalendarWeekViewComponent
} from "angular-calendar";
import { endOfDay, format, startOfDay } from "date-fns";
import { Subject } from "rxjs";

import { ErrorHandlerService } from "../../services/error.handler.service";
import { CalendarWidgetService } from "./calendar-widget.service";
import { EventDetailModalComponent } from "./event-detail-modal/event-detail-modal.component";
import { ICalendarData } from "./ICalendarData";
import { fr } from "date-fns/locale";
import { InitialUppercasePipe } from "../../pipes/initial.uppercase.pipe";
import { MatTooltip } from "@angular/material/tooltip";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { form, FormField, minLength } from "@angular/forms/signals";
import { WidgetComponent } from "../widget/widget.component";
import { injectWidgetData } from "../widget.tokens";

@Component({
  selector: "dash-calendar-widget",
  templateUrl: "./calendar-widget.component.html",
  styleUrl: "./calendar-widget.component.scss",
  imports: [
    WidgetComponent,
    FormField,
    MatIcon,
    MatButton,
    MatTooltip,
    InitialUppercasePipe,
    CalendarDayViewComponent,
    CalendarWeekViewComponent,
    CalendarMonthViewComponent,
    CalendarDatePipe,
    CalendarNextViewDirective,
    CalendarTodayDirective,
    CalendarPreviousViewDirective
  ]
})
export class CalendarWidgetComponent {
  public readonly viewDate = signal(new Date());
  public readonly refresh = new Subject<void>();
  public readonly config = signal({ calendarUrls: injectWidgetData<string[]>("calendarUrls", []) });
  public readonly configForm = form(this.config, (path) => minLength(path.calendarUrls, 1));
  public readonly isWidgetLoaded = signal(true);
  public readonly events = signal<CalendarEvent[]>([]);
  public readonly view = signal(CalendarView.Month);
  public readonly activeDayIsOpen = signal(true);
  public readonly locale = inject(LOCALE_ID);

  public readonly isCalendarViewMonth = computed(() => this.view() === CalendarView.Month);
  public readonly isCalendarViewWeek = computed(() => this.view() === CalendarView.Week);
  public readonly isCalendarViewDay = computed(() => this.view() === CalendarView.Day);
  public readonly isFormValid = computed(() => this.configForm().valid());

  public readonly calendarView = CalendarView;
  public readonly weekStartsOn = 1;

  private readonly dialog = inject(MatDialog);
  private readonly calendarWidgetService = inject(CalendarWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly MILLISECONDS_IN_A_DAY = 86400000;
  private readonly ERROR_PARSING_EVENTS = "Erreur lors de la récupération des évènements.";

  public refreshWidget(): void {
    this.events.set([]);
    this.config().calendarUrls.forEach((calendarUrl) => {
      this.calendarWidgetService.getCalendarEvents(calendarUrl).subscribe({
        next: (calendarData) => {
          this.events.update((events) => [...events, ...this.parseEvents(calendarData)]);
          this.isWidgetLoaded.set(true);
        },
        error: (error) => this.errorHandlerService.handleError(error, this.ERROR_PARSING_EVENTS)
      });
    });
  }

  public getWidgetConfig(): { calendarUrls: string[] } | undefined {
    return this.isFormValid() ? this.config() : undefined;
  }

  public onCalendarUrlAdded(): void {
    this.config.update(({ calendarUrls }) => ({ calendarUrls: [...calendarUrls, ""] }));
  }

  public removeCalendarUrl(indexToRemove: number): void {
    this.config.update(({ calendarUrls }) => ({
      calendarUrls: calendarUrls.filter((_, index) => index !== indexToRemove)
    }));
  }

  public displayTodaysDate(): string {
    return format(new Date(), "eee dd", { locale: fr });
  }

  public closeOpenMonthViewDay(): void {
    this.activeDayIsOpen.set(false);
  }

  public setView(view: CalendarView): void {
    this.view.set(view);
  }

  public handleEvent(action: string, event: CalendarEvent): void {
    this.dialog.open(EventDetailModalComponent, {
      height: "300px",
      width: "500px",
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
