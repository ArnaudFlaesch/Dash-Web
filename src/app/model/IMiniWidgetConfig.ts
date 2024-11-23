import { MiniWidgetTypeEnum } from "../enums/MiniWidgetTypeEnum";

export type IMiniWidgetConfig = {
  id: number;
  type: MiniWidgetTypeEnum;
  data?: Record<string, unknown>;
};
