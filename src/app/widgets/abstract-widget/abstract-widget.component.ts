import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  inject,
  input,
  output,
  TemplateRef
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { ModeEnum } from "../../enums/ModeEnum";
import { WidgetService } from "../../services/widget.service/widget.service";

@Component({
  selector: "dash-abstract-widget",
  templateUrl: "./abstract-widget.component.html",
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true
})
export class AbstractWidgetComponent {
  public readonly body = contentChild.required<TemplateRef<unknown> | null>("body");
  public readonly editComponent = contentChild<TemplateRef<unknown> | null>("editComponent");
  public readonly isFormValid = input(false);
  public readonly isWidgetLoaded = input(false);
  public readonly widgetData = input<Record<string, unknown>>();
  public readonly refreshWidgetAction = output();

  public widgetId: number;
  public mode: ModeEnum;

  protected readonly widgetService = inject(WidgetService);
  private readonly destroy$: Subject<unknown> = new Subject();

  public constructor() {
    const widgetId = inject<number>("widgetId" as never);

    this.mode = this.widgetData() ? ModeEnum.READ : ModeEnum.EDIT;
    this.widgetId = widgetId;
  }

  public ngOnInit(): void {
    this.mode = this.widgetData() ? ModeEnum.READ : ModeEnum.EDIT;
    this.refreshWidget();
    this.widgetService.refreshWidgetsAction.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.refreshWidget()
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  public refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshWidgetAction.emit();
    }
  }

  public toEditMode(): void {
    this.mode = this.editComponent() ? ModeEnum.EDIT : this.mode;
  }

  public toReadMode(): void {
    if (this.widgetData()) {
      this.mode = ModeEnum.READ;
    } else {
      this.toEditMode();
    }
  }

  public cancelEdition(): void {
    this.toReadMode();
  }

  public toDeleteMode(): void {
    this.mode = ModeEnum.DELETE;
  }

  public isModeRead(): boolean {
    return this.mode === ModeEnum.READ;
  }

  public isModeEdit(): boolean {
    return this.mode === ModeEnum.EDIT;
  }

  public isModeDelete(): boolean {
    return this.mode === ModeEnum.DELETE;
  }
}
