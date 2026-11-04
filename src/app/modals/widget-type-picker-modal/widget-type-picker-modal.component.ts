import { Component, inject } from "@angular/core";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MiniWidgetTypeEnum } from "../../enums/MiniWidgetTypeEnum";
import { WidgetTypeEnum } from "../../enums/WidgetTypeEnum";
import { IWidgetTypeOption, IWidgetTypePickerData } from "../../model/IWidgetTypePicker";

/** Lists the types of (mini) widgets, the dialog is closed with the key of the selected type. */

@Component({
  selector: "dash-widget-type-picker-modal",
  templateUrl: "./widget-type-picker-modal.component.html",
  styleUrl: "./widget-type-picker-modal.component.scss",
  imports: [MatDialogTitle, MatDialogContent, MatIcon, MatButton, MatDialogClose, MatDialogActions]
})
export class WidgetTypePickerModalComponent {
  public static readonly WIDGET_TYPE_OPTIONS: IWidgetTypeOption<keyof typeof WidgetTypeEnum>[] = [
    { type: "WEATHER", icon: "sunny", label: "Météo" },
    { type: "RSS", icon: "feed", label: "Flux RSS" },
    { type: "CALENDAR", icon: "calendar_month", label: "Agenda" },
    { type: "STRAVA", icon: "directions_run", label: "Strava" },
    { type: "STEAM", icon: "sports_esports", label: "Steam" },
    { type: "WORKOUT", icon: "fitness_center", label: "Sport" },
    { type: "AIRPARIF", icon: "air", label: "AirParif" },
    { type: "ECOWATT", icon: "electric_bolt", label: "Ecowatt" },
    { type: "INCIDENT", icon: "priority_high", label: "Incidents" }
  ];

  public static readonly MINI_WIDGET_TYPE_OPTIONS: IWidgetTypeOption<
    keyof typeof MiniWidgetTypeEnum
  >[] = [{ type: "WEATHER", icon: "sunny", label: "Météo" }];

  public readonly data = inject<IWidgetTypePickerData>(MAT_DIALOG_DATA);
}
