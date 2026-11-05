import { MiniWidgetTypeEnum } from "@enums/MiniWidgetTypeEnum";
import { WidgetTypeEnum } from "@enums/WidgetTypeEnum";
import { IWidgetTypeOption } from "./IWidgetTypePicker";

/** Types of widgets offered when adding a widget to a tab. */
export const WIDGET_TYPE_OPTIONS: IWidgetTypeOption<keyof typeof WidgetTypeEnum>[] = [
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

/** Types of mini widgets offered when adding a mini widget. */
export const MINI_WIDGET_TYPE_OPTIONS: IWidgetTypeOption<keyof typeof MiniWidgetTypeEnum>[] = [
  { type: "WEATHER", icon: "sunny", label: "Météo" }
];
