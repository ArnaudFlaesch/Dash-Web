import { WidgetTypeEnum } from "@widgets/widget-type.enum";

export interface IWidgetConfig {
  id: number;
  type: WidgetTypeEnum;
  data?: Record<string, unknown>;
  widgetOrder: number;
  tabId: number;
}
