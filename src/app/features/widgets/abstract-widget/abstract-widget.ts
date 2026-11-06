import {
  computed,
  contentChild,
  Directive,
  inject,
  input,
  OnInit,
  output,
  signal,
  TemplateRef
} from "@angular/core";
import { WidgetMode } from "@widgets/abstract-widget/widget-mode";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { WIDGET_ID } from "@widgets/widget-tokens";

/** Common behaviour (read / edit / delete modes) shared by widgets and mini widgets. */
@Directive()
export abstract class AbstractWidget implements OnInit {
  public readonly body = contentChild.required<TemplateRef<unknown>>("body");
  public readonly editComponent = contentChild<TemplateRef<unknown>>("editComponent");
  public readonly isFormValid = input(false);
  public readonly isWidgetLoaded = input(false);
  public readonly widgetData = input<Record<string, unknown> | undefined>(undefined);
  public readonly refreshWidgetAction = output();

  protected readonly mode = signal(WidgetMode.EDIT);
  protected readonly isModeRead = computed(() => this.mode() === WidgetMode.READ);
  protected readonly isModeEdit = computed(() => this.mode() === WidgetMode.EDIT);
  protected readonly isModeDelete = computed(() => this.mode() === WidgetMode.DELETE);

  protected readonly widgetId = inject(WIDGET_ID);
  protected readonly errorHandlerService = inject(ErrorHandlerService);
  protected readonly ERROR_UPDATING_WIDGET_DATA =
    "Erreur lors de la mise à jour de la configuration du widget.";

  public ngOnInit(): void {
    if (this.widgetData() !== undefined) {
      this.toReadMode();
    }
    this.refreshWidget();
  }

  protected refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshWidgetAction.emit();
    }
  }

  protected toEditMode(): void {
    if (this.editComponent()) {
      this.mode.set(WidgetMode.EDIT);
    }
  }

  protected toReadMode(): void {
    if (this.widgetData()) {
      this.mode.set(WidgetMode.READ);
    } else {
      this.toEditMode();
    }
  }

  protected cancelEdition(): void {
    this.toReadMode();
  }

  protected toDeleteMode(): void {
    this.mode.set(WidgetMode.DELETE);
  }

  /** Called once the widget configuration has been saved. */
  protected onWidgetDataSaved(): void {
    this.toReadMode();
    this.refreshWidget();
  }
}
