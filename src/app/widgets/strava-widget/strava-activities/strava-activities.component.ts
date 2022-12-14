import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { format } from 'date-fns';
import { IActivity } from '../IStrava';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-strava-activities',
  templateUrl: './strava-activities.component.html',
  styleUrls: ['./strava-activities.component.scss']
})
export class StravaActivitiesComponent {
  @Input()
  public activities: IActivity[] = [];

  public getTitleToDisplay(activity: IActivity): string {
    return `${format(new Date(activity.startDateLocal), 'dd MMM')}  ${activity.name}  ${
      Math.round(activity.distance * 1000) / 1000000
    } kms`;
  }

  public formatDate(date: string): string {
    return format(new Date(date), 'dd MMM');
  }

  public roundDistance(distance: number): number {
    return Math.round(distance * 100) / 100000;
  }

  public convertDecimalTimeToTime(decimalTime: number): number {
    const time = decimalTime / 60;
    const decimalPart = time % 1;
    const convertedDecimalPart = Math.round(decimalPart * 6) / 10;
    return time - decimalPart + convertedDecimalPart;
  }
}
