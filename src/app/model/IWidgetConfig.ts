import { WidgetTypeEnum } from "../enums/WidgetTypeEnum";

export interface IWidgetConfig {
  id: number;
  type: WidgetTypeEnum;
  data?: Record<string, unknown>;
  widgetOrder: number;
  tabId: number;
}
