import { Component } from '@angular/core';
import {
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { MiniWidgetTypeEnum } from '../../enums/MiniWidgetTypeEnum';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';

@Component({
  selector: 'dash-create-mini-widget-modal',
  templateUrl: './create-mini-widget-modal.component.html',
  styleUrls: ['./create-mini-widget-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatCard,
    MatCardContent,
    MatIcon,
    MatCardActions,
    MatButton,
    MatDialogClose,
    MatDialogActions
  ]
})
export class CreateMiniWidgetModalComponent {
  public miniWidgetTypeEnumKeys: { type: string; icon: string }[] = Object.keys(MiniWidgetTypeEnum)
    .filter((key) => isNaN(parseInt(key, 0)))
    .map((type) => {
      return { type: type, icon: this.getWidgetTypeEnumIconToDisplay(type) };
    });

  constructor(public dialogRef: MatDialogRef<CreateMiniWidgetModalComponent>) {}

  public getWidgetTypeEnumIconToDisplay(miniWidgetType: unknown): string {
    const key = MiniWidgetTypeEnum[miniWidgetType as MiniWidgetTypeEnum];
    switch (key as unknown as MiniWidgetTypeEnum) {
      case MiniWidgetTypeEnum.WEATHER: {
        return 'sunny';
      }
    }
  }
}
