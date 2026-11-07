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
import { HttpErrorResponse } from "@angular/common/http";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { WIDGET_ID } from "@widgets/widget-tokens";
import { WIDGET_PERSISTENCE } from "@widgets/abstract-widget/widget-persistence";

/** Common behaviour (read / edit / delete modes) shared by widgets and mini widgets. */
@Directive()
export abstract class AbstractWidget implements OnInit {
  public readonly body = contentChild.required<TemplateRef<unknown>>("body");
  public readonly editComponent = contentChild<TemplateRef<unknown>>("editComponent");
  public readonly isFormValid = input(false);
  public readonly isWidgetLoaded = input(false);
  public readonly widgetData = input<Record<string, unknown> | undefined>(undefined);
  public readonly refreshWidgetAction = output();
  /** Emitted when the edition is cancelled, so that the widget restores its saved configuration. */
  public readonly editionCancelled = output();

  private readonly mode = signal(WidgetMode.EDIT);
  public readonly isModeRead = computed(() => this.mode() === WidgetMode.READ);
  public readonly isModeEdit = computed(() => this.mode() === WidgetMode.EDIT);
  public readonly isModeDelete = computed(() => this.mode() === WidgetMode.DELETE);
  /** True once the widget has a saved configuration: only then can its edition be cancelled. */
  public readonly isWidgetDataSaved = signal(false);

  private readonly ERROR_UPDATING_WIDGET_DATA =
    "Erreur lors de la mise à jour de la configuration du widget.";

  private readonly widgetId = inject(WIDGET_ID);
  private readonly widgetPersistence = inject(WIDGET_PERSISTENCE);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public ngOnInit(): void {
    if (this.widgetData() !== undefined) {
      this.isWidgetDataSaved.set(true);
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
    if (this.editComponent()) {
      this.mode.set(WidgetMode.EDIT);
    }
  }

  public toReadMode(): void {
    if (this.widgetData()) {
      this.mode.set(WidgetMode.READ);
    } else {
      this.toEditMode();
    }
  }

  public cancelEdition(): void {
    this.editionCancelled.emit();
    this.toReadMode();
  }

  public toDeleteMode(): void {
    this.mode.set(WidgetMode.DELETE);
  }

  /** Saves the configuration of the widget, then displays it in read mode. */
  public onValidation(): void {
    this.widgetPersistence.updateWidgetData(this.widgetId, { ...this.widgetData() }).subscribe({
      next: () => this.onWidgetDataSaved(),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_UPDATING_WIDGET_DATA)
    });
  }

  public deleteWidget(): void {
    this.widgetPersistence.deleteWidget(this.widgetId);
  }

  private onWidgetDataSaved(): void {
    this.isWidgetDataSaved.set(true);
    this.toReadMode();
    this.refreshWidget();
  }
}
