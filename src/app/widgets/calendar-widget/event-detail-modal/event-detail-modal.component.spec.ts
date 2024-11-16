import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { CalendarEvent } from "angular-calendar";
import { DateFormatPipe } from "./../../../pipes/date-format.pipe";
import { EventDetailModalComponent } from "./event-detail-modal.component";

describe("EventDetailModalComponent", () => {
  let component: EventDetailModalComponent;

  const calendarEvent: CalendarEvent = {
    title: "Jour de l'an",
    start: new Date(2022, 0, 1),
    end: new Date(2022, 0, 2),
    allDay: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, DateFormatPipe],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: calendarEvent }]
    }).compileComponents();

    const fixture = TestBed.createComponent(EventDetailModalComponent);
    component = fixture.componentInstance;
  });

  it("Should display the data in the modal", () => {
    expect(component).toBeTruthy();
  });
});
