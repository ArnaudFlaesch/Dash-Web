import { Component } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { WidgetTypeEnum } from "../../enums/WidgetTypeEnum";

const WIDGET_TYPE_ICONS: Record<keyof typeof WidgetTypeEnum, { icon: string; label: string }> = {
  WEATHER: { icon: "sunny", label: "Météo" },
  RSS: { icon: "feed", label: "Flux RSS" },
  CALENDAR: { icon: "calendar_month", label: "Agenda" },
  STRAVA: { icon: "directions_run", label: "Strava" },
  STEAM: { icon: "sports_esports", label: "Steam" },
  WORKOUT: { icon: "fitness_center", label: "Sport" },
  AIRPARIF: { icon: "air", label: "AirParif" },
  ECOWATT: { icon: "electric_bolt", label: "Ecowatt" },
  INCIDENT: { icon: "priority_high", label: "Incidents" }
};

@Component({
  selector: "dash-create-widget-modal",
  templateUrl: "./create-widget-modal.component.html",
  styleUrl: "../create-widget-modal.scss",
  imports: [MatDialogTitle, MatDialogContent, MatIcon, MatButton, MatDialogClose, MatDialogActions]
})
export class CreateWidgetModalComponent {
  public readonly widgetTypes = Object.entries(WIDGET_TYPE_ICONS).map(
    ([type, { icon, label }]) => ({
      type,
      icon,
      label
    })
  );
}
