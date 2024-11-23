import { WidgetTypeEnum } from "../enums/WidgetTypeEnum";

export type IWidgetConfig = {
  id: number;
  type: WidgetTypeEnum;
  data?: Record<string, unknown>;
  widgetOrder: number;
  tabId: number;
};
