import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { format } from "date-fns";
import { IActivity } from "../IStrava";
import { fr } from "date-fns/locale/fr";
import {
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";

@Component({
  selector: "dash-strava-activities",
  templateUrl: "./strava-activities.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelContent
  ]
})
export class StravaActivitiesComponent {
  public readonly activities = input.required<IActivity[]>();

  public getTitleToDisplay(activity: IActivity): string {
    return `${format(new Date(activity.startDateLocal), "dd MMMM", { locale: fr })}  ${activity.name}  ${
      Math.round(activity.distance * 1000) / 1000000
    } kms`;
  }

  public formatDate(date: string): string {
    return format(new Date(date), "dd MMMM", { locale: fr });
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
