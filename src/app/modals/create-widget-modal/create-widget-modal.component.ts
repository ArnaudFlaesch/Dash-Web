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

  public getWidgetTypesKeys(): string[] {
    return Object.keys(WidgetTypes).filter((key) => isNaN(parseInt(key, 0)));
  }

  public getWidgetTypeIconToDisplay(widgetType: unknown): string {
    const widgetTypeKey = WidgetTypes[widgetType as WidgetTypes].toString();
    switch (widgetTypeKey) {
      case WidgetTypes.RSS.toString(): {
        return 'feed';
      }
      case WidgetTypes.WEATHER.toString(): {
        return 'sunny';
      }
      case WidgetTypes.STRAVA.toString(): {
        return 'directions_run';
      }
      case WidgetTypes.CALENDAR.toString(): {
        return 'calendar_month';
      }
      case WidgetTypes.STEAM.toString(): {
        return 'sports_esports';
      }
      case WidgetTypes.WORKOUT.toString(): {
        return 'fitness_center';
      }
      case WidgetTypes.AIRPARIF.toString(): {
        return 'air';
      }
      case WidgetTypes.TWITTER.toString(): {
        return 'newspaper';
      }
      default: {
        return '';
      }
    }
  }
}
