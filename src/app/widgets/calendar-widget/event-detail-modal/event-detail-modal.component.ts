import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CalendarEvent } from 'angular-calendar';

@Component({
  selector: 'dash-event-detail-modal',
  templateUrl: './event-detail-modal.component.html',
  styleUrls: ['./event-detail-modal.component.scss']
})
export class EventDetailModalComponent {
  public eventDetail: CalendarEvent;
  constructor(@Inject(MAT_DIALOG_DATA) public data: CalendarEvent) {
    this.eventDetail = data;
  }
}
