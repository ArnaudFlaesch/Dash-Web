import { Component, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { WidgetTypePickerData } from "@widgets/widget-type-picker-modal/widget-type-picker-data";

/** Lists the types of (mini) widgets, the dialog is closed with the key of the selected type. */
@Component({
  selector: "dash-widget-type-picker-modal",
  templateUrl: "./widget-type-picker-modal.html",
  styleUrl: "./widget-type-picker-modal.scss",
  imports: [MatDialogTitle, MatDialogContent, MatIcon, MatButton, MatDialogClose, MatDialogActions]
})
export class WidgetTypePickerModal {
  protected readonly labels = {
    close: "Fermer"
  };

  protected readonly data = inject<WidgetTypePickerData>(MAT_DIALOG_DATA);
}
