import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  inject,
  input,
  output,
  signal,
  TemplateRef
} from "@angular/core";
import { ModeEnum } from "../../enums/ModeEnum";
import { WidgetService } from "../../services/widget.service/widget.service";

@Component({
  selector: "dash-abstract-widget",
  templateUrl: "./abstract-widget.component.html",
  changeDetection: ChangeDetectionStrategy.Default
})
export class AbstractWidgetComponent {
  public readonly body = contentChild.required<TemplateRef<unknown> | null>("body");
  public readonly editComponent = contentChild<TemplateRef<unknown> | null>("editComponent");
  public readonly isFormValid = input(false);
  public readonly isWidgetLoaded = input(false);
  public readonly widgetData = input<Record<string, unknown>>();
  public readonly refreshWidgetAction = output();

  public mode = signal(this.widgetData() ? ModeEnum.READ : ModeEnum.EDIT);
  public widgetId: number;

  protected readonly widgetService = inject(WidgetService);

  public constructor() {
    const widgetId = inject<number>("widgetId" as never);
    this.widgetId = widgetId;
  }

  public refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshWidgetAction.emit();
    }
  }

  public toEditMode(): void {
    this.mode.set(this.editComponent() ? ModeEnum.EDIT : this.mode());
  }

  public toReadMode(): void {
    if (this.widgetData()) {
      this.mode.set(ModeEnum.READ);
    } else {
      this.toEditMode();
    }
  }

  public cancelEdition(): void {
    this.toReadMode();
  }

  public toDeleteMode(): void {
    this.mode.set(ModeEnum.DELETE);
  }

  public isModeRead(): boolean {
    return this.mode() === ModeEnum.READ;
  }

  public isModeEdit(): boolean {
    return this.mode() === ModeEnum.EDIT;
  }

  public isModeDelete(): boolean {
    return this.mode() === ModeEnum.DELETE;
  }
}
