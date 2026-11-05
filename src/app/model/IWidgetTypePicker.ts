export interface IWidgetTypeOption<T extends string = string> {
  type: T;
  icon: string;
  label: string;
}

export interface IWidgetTypePickerData<T extends string = string> {
  title: string;
  widgetTypes: IWidgetTypeOption<T>[];
}
