import { Component } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogClose, MatDialogActions } from '@angular/material/dialog';
import { WidgetTypeEnum } from '../../enums/WidgetTypeEnum';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';
import { NgFor } from '@angular/common';

@Component({
    selector: 'dash-create-widget-modal',
    templateUrl: './create-widget-modal.component.html',
    styleUrls: ['./create-widget-modal.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, MatDialogContent, NgFor, MatCard, MatCardContent, MatIcon, MatCardActions, MatButton, MatDialogClose, MatDialogActions]
})
export class CreateWidgetModalComponent {
  public widgetTypeEnumKeys: { type: string; icon: string }[] = Object.keys(WidgetTypeEnum)
    .filter((key) => isNaN(parseInt(key, 0)))
    .map((type: string) => {
      return { type: type, icon: this.getWidgetTypeEnumIconToDisplay(type) };
    });

  constructor(public dialogRef: MatDialogRef<CreateWidgetModalComponent>) {}

  public getWidgetTypeEnumIconToDisplay(widgetType: unknown): string {
    const WidgetTypeEnumKey = WidgetTypeEnum[widgetType as WidgetTypeEnum].toString();
    switch (WidgetTypeEnumKey) {
      case WidgetTypeEnum.RSS.toString(): {
        return 'feed';
      }
      case WidgetTypeEnum.WEATHER.toString(): {
        return 'sunny';
      }
      case WidgetTypeEnum.STRAVA.toString(): {
        return 'directions_run';
      }
      case WidgetTypeEnum.CALENDAR.toString(): {
        return 'calendar_month';
      }
      case WidgetTypeEnum.STEAM.toString(): {
        return 'sports_esports';
      }
      case WidgetTypeEnum.WORKOUT.toString(): {
        return 'fitness_center';
      }
      case WidgetTypeEnum.AIRPARIF.toString(): {
        return 'air';
      }
      case WidgetTypeEnum.ECOWATT.toString(): {
        return 'electric_bolt';
      }
      case WidgetTypeEnum.INCIDENT.toString(): {
        return 'priority_high';
      }
      default: {
        return '';
      }
    }
  }
}
