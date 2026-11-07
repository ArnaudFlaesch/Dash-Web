import { WidgetType } from "@widgets/widget-type";

export interface WidgetConfig {
  id: number;
  type: WidgetType;
  data?: Record<string, unknown>;
  widgetOrder: number;
  tabId: number;
}
