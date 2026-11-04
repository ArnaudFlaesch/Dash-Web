import { MiniWidgetTypeEnum } from "../enums/MiniWidgetTypeEnum";

export interface IMiniWidgetConfig {
  id: number;
  type: MiniWidgetTypeEnum;
  data?: Record<string, unknown>;
}
