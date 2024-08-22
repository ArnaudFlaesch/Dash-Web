import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { WidgetTypeEnum } from '../../enums/WidgetTypeEnum';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';

@Component({
  selector: 'dash-create-widget-modal',
  templateUrl: './create-widget-modal.component.html',
  styleUrls: ['./create-widget-modal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class CreateWidgetModalComponent {
  dialogRef = inject<MatDialogRef<CreateWidgetModalComponent>>(MatDialogRef);

  public widgetTypeEnumKeys: { type: string; icon: string }[] = Object.keys(WidgetTypeEnum)
    .filter((key) => isNaN(parseInt(key, 0)))
    .map((type: string) => {
      return { type: type, icon: this.getWidgetTypeEnumIconToDisplay(type) };
    });

  public getWidgetTypeEnumIconToDisplay(widgetType: unknown): string {
    const widgetTypeEnumKey = WidgetTypeEnum[widgetType as WidgetTypeEnum];
    switch (widgetTypeEnumKey as unknown as WidgetTypeEnum) {
      case WidgetTypeEnum.RSS: {
        return 'feed';
      }
      case WidgetTypeEnum.WEATHER: {
        return 'sunny';
      }
      case WidgetTypeEnum.STRAVA: {
        return 'directions_run';
      }
      case WidgetTypeEnum.CALENDAR: {
        return 'calendar_month';
      }
      case WidgetTypeEnum.STEAM: {
        return 'sports_esports';
      }
      case WidgetTypeEnum.WORKOUT: {
        return 'fitness_center';
      }
      case WidgetTypeEnum.AIRPARIF: {
        return 'air';
      }
      case WidgetTypeEnum.ECOWATT: {
        return 'electric_bolt';
      }
      case WidgetTypeEnum.INCIDENT: {
        return 'priority_high';
      }
    }
  }
}
