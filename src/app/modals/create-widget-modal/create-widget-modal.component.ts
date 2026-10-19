import { Component } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatCard, MatCardActions, MatCardContent } from "@angular/material/card";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { WidgetTypeEnum } from "../../enums/WidgetTypeEnum";

const WIDGET_TYPE_ICONS: Record<keyof typeof WidgetTypeEnum, string> = {
  WEATHER: "sunny",
  RSS: "feed",
  CALENDAR: "calendar_month",
  STRAVA: "directions_run",
  STEAM: "sports_esports",
  WORKOUT: "fitness_center",
  AIRPARIF: "air",
  ECOWATT: "electric_bolt",
  INCIDENT: "priority_high"
};

@Component({
  selector: "dash-create-widget-modal",
  templateUrl: "./create-widget-modal.component.html",
  styleUrl: "../create-widget-modal.scss",
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
  public readonly widgetTypes = Object.entries(WIDGET_TYPE_ICONS).map(([type, icon]) => ({
    type,
    icon
  }));
}
