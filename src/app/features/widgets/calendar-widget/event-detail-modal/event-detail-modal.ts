import { Component, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { CalendarEvent } from "angular-calendar";
import { DateFormatPipe } from "@shared/dates/date-format-pipe";
import { MatButton } from "@angular/material/button";

@Component({
  selector: "dash-event-detail-modal",
  templateUrl: "./event-detail-modal.html",
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    DateFormatPipe
  ]
})
export class EventDetailModal {
  protected readonly labels = {
    start: "Début",
    end: "Fin",
    ok: "Ok"
  };

  protected readonly eventDetail = inject<CalendarEvent>(MAT_DIALOG_DATA);
}
