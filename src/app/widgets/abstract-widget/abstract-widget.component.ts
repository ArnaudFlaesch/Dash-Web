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
import { ModeEnum } from "../../enums/ModeEnum";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { WIDGET_ID } from "../widget.tokens";

/** Common behaviour (read / edit / delete modes) shared by widgets and mini widgets. */
@Directive()
export abstract class AbstractWidgetComponent implements OnInit {
  public readonly body = contentChild.required<TemplateRef<unknown>>("body");
  public readonly editComponent = contentChild<TemplateRef<unknown>>("editComponent");
  public readonly isFormValid = input(false);
  public readonly isWidgetLoaded = input(false);
  public readonly widgetData = input<Record<string, unknown> | undefined>(undefined);
  public readonly refreshWidgetAction = output();

  public readonly mode = signal(ModeEnum.EDIT);
  public readonly isModeRead = computed(() => this.mode() === ModeEnum.READ);
  public readonly isModeEdit = computed(() => this.mode() === ModeEnum.EDIT);
  public readonly isModeDelete = computed(() => this.mode() === ModeEnum.DELETE);

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

  public refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshWidgetAction.emit();
    }
  }

  public toEditMode(): void {
    if (this.editComponent()) {
      this.mode.set(ModeEnum.EDIT);
    }
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

  /** Called once the widget configuration has been saved. */
  protected onWidgetDataSaved(): void {
    this.toReadMode();
    this.refreshWidget();
  }
}
