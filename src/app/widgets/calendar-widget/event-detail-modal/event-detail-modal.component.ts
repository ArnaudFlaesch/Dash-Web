import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
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
  public readonly eventDetail: CalendarEvent;
  public readonly data = inject(MAT_DIALOG_DATA);

  public constructor() {
    this.eventDetail = this.data;
  }
}
