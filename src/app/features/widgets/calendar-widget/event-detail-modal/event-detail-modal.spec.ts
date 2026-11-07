import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CalendarEvent } from "angular-calendar";
import { EventDetailModal } from "./event-detail-modal";

describe("EventDetailModal", () => {
  let fixture: ComponentFixture<EventDetailModal>;

  const calendarEvent: CalendarEvent = {
    title: "Jour de l'an",
    start: new Date(2022, 0, 1),
    end: new Date(2022, 0, 2),
    allDay: true
  };

  function createComponent(event: CalendarEvent): void {
    TestBed.configureTestingModule({
      providers: [{ provide: MAT_DIALOG_DATA, useValue: event }]
    });
    fixture = TestBed.createComponent(EventDetailModal);
  }

  function getContentLines(): string[] {
    return [...fixture.nativeElement.querySelectorAll("mat-dialog-content div")].map(
      (line: HTMLElement) => line.textContent?.trim() ?? ""
    );
  }

  it("Should display the data in the modal", async () => {
    createComponent(calendarEvent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector("h1")?.textContent?.trim()).toEqual(calendarEvent.title);
    expect(getContentLines()).toEqual([
      `Début ${calendarEvent.start.toLocaleString("fr")}`,
      `Fin ${calendarEvent.end?.toLocaleString("fr")}`
    ]);
    expect(element.querySelector("mat-dialog-actions button")?.textContent?.trim()).toEqual("Ok");
  });

  it("Should not display the end of an event without end date", async () => {
    createComponent({ title: "Rappel", start: new Date(2022, 0, 1, 9, 30) });
    await fixture.whenStable();
    expect(getContentLines()).toEqual([
      `Début ${new Date(2022, 0, 1, 9, 30).toLocaleString("fr")}`
    ]);
  });
});
