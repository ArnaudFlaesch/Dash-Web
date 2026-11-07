import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, LOCALE_ID, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
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
import { endOfDay, format, isSameDay, isSameMonth } from "date-fns";
import { catchError, defaultIfEmpty, forkJoin, map, of } from "rxjs";

import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { CalendarWidgetService } from "./calendar-widget-service";
import { EventDetailModal } from "./event-detail-modal/event-detail-modal";
import { CalendarData } from "./calendar-data";
import { fr } from "date-fns/locale";
import { InitialUppercasePipe } from "@shared/text/initial-uppercase-pipe";
import { MatTooltip } from "@angular/material/tooltip";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { applyEach, form, FormField, minLength } from "@angular/forms/signals";
import { requiredText } from "@shared/forms/form-validators";
import { Widget } from "@widgets/widget/widget";
import { injectWidgetData } from "@widgets/widget-tokens";

@Component({
  selector: "dash-calendar-widget",
  templateUrl: "./calendar-widget.html",
  styleUrl: "./calendar-widget.scss",
  imports: [
    Widget,
    FormField,
    MatIcon,
    MatButton,
    MatIconButton,
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
export class CalendarWidget {
  private readonly MILLISECONDS_IN_A_DAY = 86400000;

  protected readonly labels = {
    calendar: "Agenda",
    enterIcalUrl: "Saisissez une URL iCal",
    calendarUrl: "URL du calendrier",
    delete: "Supprimer",
    addCalendar: "Ajouter un calendrier",
    previous: "Précédent",
    today: "Aujourd'hui",
    next: "Suivant",
    day: "Jour",
    month: "Mois",
    week: "Semaine"
  };

  private readonly ERROR_MESSAGES = {
    parsingEvents: "Erreur lors de la récupération des évènements."
  };

  public readonly viewDate = signal(new Date());
  private readonly config = signal({
    calendarUrls: injectWidgetData<string[]>("calendarUrls", [])
  });
  public readonly configForm = form(this.config, (path) => {
    minLength(path.calendarUrls, 1);
    applyEach(path.calendarUrls, (calendarUrl) => requiredText(calendarUrl));
  });
  public readonly isWidgetLoaded = signal(true);
  public readonly view = signal(CalendarView.Month);
  public readonly activeDayIsOpen = signal(true);
  // A new object on each refresh, so that the resource reloads even if the urls are unchanged
  private readonly refreshedCalendarUrls = signal<{ calendarUrls: string[] } | undefined>(
    undefined
  );

  /** Events of all the calendars saved on the last refresh, a failing calendar is skipped. */
  private readonly eventsResource = rxResource({
    params: () => this.refreshedCalendarUrls(),
    stream: ({ params: { calendarUrls } }) =>
      forkJoin(
        calendarUrls.map((calendarUrl) =>
          this.calendarWidgetService.getCalendarEvents(calendarUrl).pipe(
            map((calendarData) => this.parseEvents(calendarData)),
            catchError((error: HttpErrorResponse) => {
              this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.parsingEvents);
              return of([]);
            })
          )
        )
      ).pipe(
        map((eventsByCalendar) => eventsByCalendar.flat()),
        defaultIfEmpty([])
      ),
    defaultValue: [] as CalendarEvent[]
  });

  public readonly events = this.eventsResource.value;
  public readonly isCalendarViewMonth = computed(() => this.view() === CalendarView.Month);
  public readonly isCalendarViewWeek = computed(() => this.view() === CalendarView.Week);
  public readonly isCalendarViewDay = computed(() => this.view() === CalendarView.Day);
  public readonly isFormValid = computed(() => this.configForm().valid());
  public readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));

  public readonly calendarView = CalendarView;
  public readonly weekStartsOn = 1;

  public readonly locale = inject(LOCALE_ID);
  private readonly dialog = inject(MatDialog);
  private readonly calendarWidgetService = inject(CalendarWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  // Configuration of the last refresh, restored when the edition is cancelled
  private savedConfig = this.config();

  public refreshWidget(): void {
    this.savedConfig = this.config();
    this.refreshedCalendarUrls.set({
      calendarUrls: this.config().calendarUrls.map((calendarUrl) => calendarUrl.trim())
    });
  }

  public restoreSavedConfig(): void {
    this.config.set(this.savedConfig);
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

  /** Opens the clicked day of the month, or closes it when it is already opened or has no event. */
  public onMonthDayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    const viewDate = this.viewDate();
    if (!isSameMonth(date, viewDate)) {
      return;
    }
    const isOpenedDay = isSameDay(date, viewDate) && this.activeDayIsOpen();
    this.activeDayIsOpen.set(!isOpenedDay && events.length > 0);
    this.viewDate.set(date);
  }

  public setView(view: CalendarView): void {
    this.view.set(view);
  }

  public openEventDetail(event: CalendarEvent): void {
    this.dialog.open(EventDetailModal, { width: "500px", data: event });
  }

  private parseEvents(calendarData: CalendarData[]): CalendarEvent[] {
    return calendarData
      .filter((event) => event.startDate && event.endDate && event.description)
      .map((event) => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        if (!this.isMidnightUtc(startDate) || !this.isMidnightUtc(endDate)) {
          return { title: event.description, start: startDate, end: endDate, allDay: false };
        }
        // Days (one or several) are sent as dates at midnight UTC, the end day being excluded:
        // they are displayed on the same days in the local timezone
        const lastDay = new Date(
          Math.max(startDate.getTime(), endDate.getTime() - this.MILLISECONDS_IN_A_DAY)
        );
        return {
          title: event.description,
          start: this.toLocalDay(startDate),
          end: endOfDay(this.toLocalDay(lastDay)),
          allDay: true
        };
      });
  }

  private isMidnightUtc(date: Date): boolean {
    return date.getUTCHours() === 0 && date.getUTCMinutes() === 0;
  }

  /** Local midnight of the UTC day of the date. */
  private toLocalDay(date: Date): Date {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
}
