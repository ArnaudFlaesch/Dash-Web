import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  TemplateRef,
  inject,
  input,
  output
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
  protected widgetService = inject(WidgetService);

  @ContentChild("body", { static: false })
  body: TemplateRef<unknown> | null = null;

  @ContentChild("editComponent", { static: false })
  editComponent: TemplateRef<unknown> | null = null;

  readonly isFormValid = input(false);
  readonly isWidgetLoaded = input(false);
  readonly widgetData = input<Record<string, unknown>>();
  readonly refreshWidgetAction = output();

  public widgetId: number;
  public mode: ModeEnum;

  private readonly destroy$: Subject<unknown> = new Subject();

  constructor() {
    const widgetId = inject<number>("widgetId" as never);

    this.mode = this.widgetData() ? ModeEnum.READ : ModeEnum.EDIT;
    this.widgetId = widgetId;
  }

  ngOnInit(): void {
    this.mode = this.widgetData() ? ModeEnum.READ : ModeEnum.EDIT;
    this.refreshWidget();
    this.widgetService.refreshWidgetsAction.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.refreshWidget()
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  public refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshWidgetAction.emit();
    }
  }

  public toEditMode(): void {
    this.mode = this.editComponent ? ModeEnum.EDIT : this.mode;
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
