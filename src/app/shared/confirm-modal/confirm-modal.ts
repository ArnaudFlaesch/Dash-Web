import { Component, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { ConfirmModalData } from "@shared/confirm-modal/confirm-modal-data";

/** Asks the user to confirm an action, the dialog is closed with true once confirmed. */
@Component({
  selector: "dash-confirm-modal",
  templateUrl: "./confirm-modal.html",
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, MatDialogClose]
})
export class ConfirmModal {
  protected readonly labels = {
    confirmation: "Confirmation",
    close: "Fermer",
    confirm: "Confirmer"
  };

  protected readonly data = inject<ConfirmModalData>(MAT_DIALOG_DATA);
}
