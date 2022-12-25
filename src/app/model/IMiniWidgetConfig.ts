import { WidgetTypeEnum } from '../enums/WidgetTypeEnum';

export interface IMiniWidgetConfig {
  id: number;
  type: WidgetTypeEnum;
  data?: Record<string, unknown>;
}
