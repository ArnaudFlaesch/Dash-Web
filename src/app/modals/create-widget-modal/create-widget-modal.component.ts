import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { WidgetTypes } from './../../enums/WidgetsEnum';

@Component({
  selector: 'app-create-widget-modal',
  templateUrl: './create-widget-modal.component.html',
  styleUrls: ['./create-widget-modal.component.scss']
})
export class CreateWidgetModalComponent {
  constructor(public dialogRef: MatDialogRef<CreateWidgetModalComponent>) {}

  public getWidgetTypesKeys = () =>
    Object.keys(WidgetTypes).filter((key) => isNaN(parseInt(key, 0)));
}
