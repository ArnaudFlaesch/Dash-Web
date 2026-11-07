export interface WidgetTypeOption<T extends string = string> {
  type: T;
  icon: string;
  label: string;
}

export interface WidgetTypePickerData<T extends string = string> {
  title: string;
  widgetTypes: WidgetTypeOption<T>[];
}
