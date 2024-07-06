import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'dash-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, MatDialogClose]
})
export class ConfirmModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { confirmMessage: string }) {}
}
