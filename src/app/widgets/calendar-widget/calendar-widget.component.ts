import {
  ChangeDetectionStrategy,
  Component,
  inject,
  LOCALE_ID,
  signal,
  WritableSignal
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import {
  CalendarCommonModule,
  CalendarDayModule,
  CalendarEvent,
  CalendarMonthModule,
  CalendarView,
  CalendarWeekModule
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
import { WidgetComponent } from "../widget/widget.component";

@Component({
  selector: "dash-calendar-widget",
  templateUrl: "./calendar-widget.component.html",
  styleUrls: ["./calendar-widget.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WidgetComponent,
    MatIcon,
    MatButton,
    MatTooltip,
    CalendarCommonModule,
    CalendarMonthModule,
    CalendarWeekModule,
    CalendarDayModule,
    InitialUppercasePipe
  ]
})
export class CalendarWidgetComponent {
  public viewDate: Date = new Date();
  public refresh: Subject<unknown> = new Subject();
  public readonly calendarUrls: WritableSignal<string[]> = signal([]);
  public readonly isWidgetLoaded = signal(true);
  public readonly events: WritableSignal<CalendarEvent[]> = signal([]);
  public readonly view = signal(CalendarView.Month);
  public readonly activeDayIsOpen = signal(true);
  public readonly locale = inject(LOCALE_ID);

  public readonly calendarView = CalendarView;
  public readonly weekStartsOn = 1;

  private readonly dialog = inject(MatDialog);
  private readonly calendarWidgetService = inject(CalendarWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly MILLISECONDS_IN_A_DAY = 86400000;
  private readonly ERROR_PARSING_EVENTS = "Erreur lors de la récupération des évènements.";

  public refreshWidget(): void {
    this.events.set([]);
    this.calendarUrls()?.forEach((calendarUrl: string) => {
      this.calendarWidgetService.getCalendarEvents(calendarUrl).subscribe({
        next: (calendarData) => {
          this.events.set([...this.events(), ...this.parseEvents(calendarData)]);
          this.isWidgetLoaded.set(true);
        },
        error: (error) => this.errorHandlerService.handleError(error, this.ERROR_PARSING_EVENTS)
      });
    });
  }

  public getWidgetConfig(): { calendarUrls: string[] } | undefined {
    return this.calendarUrls()?.length ? { calendarUrls: this.calendarUrls() } : undefined;
  }

  public onCalendarUrlAdded(): void {
    this.calendarUrls.update((calendarUrls) => [...calendarUrls, ""]);
  }

  public removeCalendarUrl(calendarUrl: string): void {
    this.calendarUrls.set(this.calendarUrls().filter((url) => url !== calendarUrl));
  }

  public displayTodaysDate(): string {
    return format(new Date(), "eee dd", { locale: fr });
  }

  public onCalendarUrlUpdated(event: Event): void {
    this.calendarUrls.set(
      this.calendarUrls().map((url: string, index: number) => {
        const eventTarget = event.target as HTMLInputElement;
        return index.toString() === eventTarget?.id ? eventTarget.value : url;
      })
    );
  }

  public isFormValid(): boolean {
    return this.calendarUrls() && this.calendarUrls().length > 0;
  }

  public closeOpenMonthViewDay(): void {
    this.activeDayIsOpen.set(false);
  }

  public setView(view: CalendarView): void {
    this.view.set(view);
  }

  public isCalendarViewMonth(): boolean {
    return this.view() === CalendarView.Month;
  }

  public isCalendarViewWeek(): boolean {
    return this.view() === CalendarView.Week;
  }

  public isCalendarViewDay(): boolean {
    return this.view() === CalendarView.Day;
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
