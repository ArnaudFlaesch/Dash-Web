import { DateFormatPipe } from './../../../pipes/date-format.pipe';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CalendarEvent } from 'angular-calendar';
import { EventDetailModalComponent } from './event-detail-modal.component';

describe('EventDetailModalComponent', () => {
  let spectator: Spectator<EventDetailModalComponent>;

  const calendarEvent: CalendarEvent = {
    title: "Jour de l'an",
    start: new Date(2022, 0, 1),
    end: new Date(2022, 0, 2),
    allDay: true
  };

  const createComponent = createComponentFactory({
    component: EventDetailModalComponent,
    imports: [MatDialogModule],
    declarations:[DateFormatPipe],
    providers: [{ provide: MAT_DIALOG_DATA, useValue: calendarEvent }]
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('Should display the data in the modal', () => {
    expect(spectator.query('h1')?.textContent).toEqual(calendarEvent.title);
  });
});
