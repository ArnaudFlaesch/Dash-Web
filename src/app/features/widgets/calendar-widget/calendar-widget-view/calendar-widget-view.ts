import { Component, computed, input, output, signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
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
import { format, isSameDay, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { InitialUppercasePipe } from "@shared/text/initial-uppercase-pipe";

@Component({
  selector: "dash-calendar-widget-view",
  templateUrl: "./calendar-widget-view.html",
  styleUrl: "./calendar-widget-view.scss",
  imports: [
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
export class CalendarWidgetView {
  protected readonly labels = {
    previous: "Précédent",
    today: "Aujourd'hui",
    next: "Suivant",
    day: "Jour",
    month: "Mois",
    week: "Semaine"
  };

  public readonly events = input.required<CalendarEvent[]>();
  public readonly eventSelected = output<CalendarEvent>();

  public readonly viewDate = signal(new Date());
  public readonly view = signal(CalendarView.Month);
  public readonly activeDayIsOpen = signal(true);

  public readonly isCalendarViewMonth = computed(() => this.view() === CalendarView.Month);
  public readonly isCalendarViewWeek = computed(() => this.view() === CalendarView.Week);
  public readonly isCalendarViewDay = computed(() => this.view() === CalendarView.Day);

  public readonly calendarView = CalendarView;
  public readonly weekStartsOn = 1;

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
}
