import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { CalendarEvent } from 'angular-calendar';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'dash-event-detail-modal',
  templateUrl: './event-detail-modal.component.html',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    DateFormatPipe
  ]
})
export class EventDetailModalComponent {
  public eventDetail: CalendarEvent;
  constructor(@Inject(MAT_DIALOG_DATA) public data: CalendarEvent) {
    this.eventDetail = data;
  }
}
