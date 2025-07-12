import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  inject,
  input,
  OnInit,
  output,
  signal,
  TemplateRef
} from "@angular/core";
import { ModeEnum } from "../../enums/ModeEnum";
import { WidgetService } from "../../services/widget.service/widget.service";

@Component({
  selector: "dash-abstract-widget",
  templateUrl: "./abstract-widget.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbstractWidgetComponent implements OnInit {
  public readonly body = contentChild.required<TemplateRef<unknown> | null>("body");
  public readonly editComponent = contentChild<TemplateRef<unknown> | null>("editComponent");
  public readonly isFormValid = input(false);
  public readonly isWidgetLoaded = input(false);
  public readonly widgetData = input<Record<string, unknown> | undefined>(undefined);
  public readonly refreshWidgetAction = output();

  public readonly mode = signal(ModeEnum.EDIT);
  public widgetId = inject<number>("widgetId" as never);

  protected readonly widgetService = inject(WidgetService);

  public ngOnInit(): void {
    if (this.widgetData() !== undefined) {
      this.toReadMode();
    }
    this.refreshWidget();
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
