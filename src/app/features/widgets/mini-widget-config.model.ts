import { MiniWidgetTypeEnum } from "@widgets/mini-widget-type.enum";

export interface IMiniWidgetConfig {
  id: number;
  type: MiniWidgetTypeEnum;
  data?: Record<string, unknown>;
}
