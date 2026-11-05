import { Component, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { IConfirmModalData } from "@model/IConfirmModalData";

/** Asks the user to confirm an action, the dialog is closed with true once confirmed. */
@Component({
  selector: "dash-confirm-modal",
  templateUrl: "./confirm-modal.component.html",
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, MatDialogClose]
})
export class ConfirmModalComponent {
  public readonly labels = {
    confirmation: "Confirmation",
    close: "Fermer",
    confirm: "Confirmer"
  };

  public readonly data = inject<IConfirmModalData>(MAT_DIALOG_DATA);
}
