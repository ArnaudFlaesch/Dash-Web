import { MiniWidgetType } from "@widgets/mini-widget-type";

export interface MiniWidgetConfig {
  id: number;
  type: MiniWidgetType;
  data?: Record<string, unknown>;
}
