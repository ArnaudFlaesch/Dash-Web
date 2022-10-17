import { WidgetTypes } from '../enums/WidgetsEnum';

export interface IWidgetConfig {
  id: number;
  type: WidgetTypes;
  data?: Record<string, unknown>;
  widgetOrder: number;
  tabId: number;
}
