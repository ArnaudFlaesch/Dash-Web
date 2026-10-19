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
import { MiniWidgetTypeEnum } from "../../enums/MiniWidgetTypeEnum";

const MINI_WIDGET_TYPE_ICONS: Record<keyof typeof MiniWidgetTypeEnum, string> = {
  WEATHER: "sunny"
};

@Component({
  selector: "dash-create-mini-widget-modal",
  templateUrl: "./create-mini-widget-modal.component.html",
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
export class CreateMiniWidgetModalComponent {
  public readonly miniWidgetTypes = Object.entries(MINI_WIDGET_TYPE_ICONS).map(([type, icon]) => ({
    type,
    icon
  }));
}
