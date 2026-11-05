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
import { IWidgetTypePickerData } from "@widgets/widget-type-picker-modal/widget-type-picker.model";

/** Lists the types of (mini) widgets, the dialog is closed with the key of the selected type. */
@Component({
  selector: "dash-widget-type-picker-modal",
  templateUrl: "./widget-type-picker-modal.html",
  styleUrl: "./widget-type-picker-modal.scss",
  imports: [MatDialogTitle, MatDialogContent, MatIcon, MatButton, MatDialogClose, MatDialogActions]
})
export class WidgetTypePickerModal {
  public readonly labels = {
    close: "Fermer"
  };

  public readonly data = inject<IWidgetTypePickerData>(MAT_DIALOG_DATA);
}
