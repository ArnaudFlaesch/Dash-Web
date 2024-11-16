import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose
} from "@angular/material/dialog";
import { CalendarEvent } from "angular-calendar";
import { DateFormatPipe } from "../../../pipes/date-format.pipe";
import { MatButton } from "@angular/material/button";

@Component({
  selector: "dash-event-detail-modal",
  templateUrl: "./event-detail-modal.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  data = inject(MAT_DIALOG_DATA);

  public eventDetail: CalendarEvent;
  constructor() {
    const data = this.data;

    this.eventDetail = data;
  }
}
