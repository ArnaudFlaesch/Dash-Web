import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MiniWidgetTypeEnum } from '../../enums/MiniWidgetTypeEnum';

@Component({
  selector: 'app-create-mini-widget-modal',
  templateUrl: './create-mini-widget-modal.component.html',
  styleUrls: ['./create-mini-widget-modal.component.scss']
})
export class CreateMiniWidgetModalComponent {
  public miniWidgetTypeEnumKeys: { type: string; icon: string }[] = Object.keys(MiniWidgetTypeEnum)
    .filter((key) => isNaN(parseInt(key, 0)))
    .map((type: string) => {
      return { type: type, icon: this.getWidgetTypeEnumIconToDisplay(type) };
    });

  constructor(public dialogRef: MatDialogRef<CreateMiniWidgetModalComponent>) {}

  public getWidgetTypeEnumIconToDisplay(miniWidgetType: unknown): string {
    const miniWidgetTypeEnumKey =
      MiniWidgetTypeEnum[miniWidgetType as MiniWidgetTypeEnum].toString();
    switch (miniWidgetTypeEnumKey) {
      case MiniWidgetTypeEnum.WEATHER.toString(): {
        return 'sunny';
      }
      case MiniWidgetTypeEnum.AIRPARIF.toString(): {
        return 'air';
      }
      case MiniWidgetTypeEnum.ECOWATT.toString(): {
        return 'electric_bolt';
      }
      default: {
        return '';
      }
    }
  }
}
