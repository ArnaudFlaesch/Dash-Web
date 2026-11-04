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
import { IWidgetTypePickerData } from "../../model/IWidgetTypePicker";

/** Lists the types of (mini) widgets, the dialog is closed with the key of the selected type. */
@Component({
  selector: "dash-widget-type-picker-modal",
  templateUrl: "./widget-type-picker-modal.component.html",
  styleUrl: "./widget-type-picker-modal.component.scss",
  imports: [MatDialogTitle, MatDialogContent, MatIcon, MatButton, MatDialogClose, MatDialogActions]
})
export class WidgetTypePickerModalComponent {
  public readonly labels = {
    close: "Fermer"
  };

  public readonly data = inject<IWidgetTypePickerData>(MAT_DIALOG_DATA);
}
