import { MiniWidgetType } from "@widgets/mini-widget-type";
import { WidgetType } from "@widgets/widget-type";
import { WidgetTypeOption } from "./widget-type-picker-data";

/** Types of widgets offered when adding a widget to a tab. */
export const WIDGET_TYPE_OPTIONS: WidgetTypeOption<keyof typeof WidgetType>[] = [
  { type: "WEATHER", icon: "sunny", label: "Météo" },
  { type: "RSS", icon: "feed", label: "Flux RSS" },
  { type: "CALENDAR", icon: "calendar_month", label: "Agenda" },
  { type: "STRAVA", icon: "directions_run", label: "Strava" },
  { type: "STEAM", icon: "sports_esports", label: "Steam" },
  { type: "WORKOUT", icon: "fitness_center", label: "Sport" },
  { type: "AIRPARIF", icon: "air", label: "Airparif" },
  { type: "ECOWATT", icon: "electric_bolt", label: "Ecowatt" },
  { type: "INCIDENT", icon: "priority_high", label: "Incidents" }
];

/** Types of mini widgets offered when adding a mini widget. */
export const MINI_WIDGET_TYPE_OPTIONS: WidgetTypeOption<keyof typeof MiniWidgetType>[] = [
  { type: "WEATHER", icon: "sunny", label: "Météo" }
];
