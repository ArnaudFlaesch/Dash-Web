import {
  Component,
  ContentChild,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef
} from '@angular/core';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { ModeEnum } from '../../enums/ModeEnum';
import { MiniWidgetService } from 'src/app/services/widget.service/miniwidget.service';

@Component({
  selector: 'app-mini-widget',
  templateUrl: './mini-widget.component.html',
  styleUrls: ['./mini-widget.component.scss']
})
export class MiniWidgetComponent implements OnInit, OnDestroy {
  @ContentChild('body', { static: false })
  body: TemplateRef<unknown> | null;

  @ContentChild('editComponent', { static: false })
  editComponent: TemplateRef<unknown> | null;

  @Input() isFormValid = false;
  @Input() isWidgetLoaded = false;
  @Input() widgetData: Record<string, unknown> | undefined;
  @Output() refreshWidgetAction = new EventEmitter();

  public widgetId: number;
  public mode: ModeEnum;

  private refreshInterval: NodeJS.Timer | null = null;
  private refreshTimeout = 900000; // 15 minutes

  private ERROR_UPDATING_WIDGET_DATA =
    'Erreur lors de la mise à jour de la configuration du widget.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private miniWidgetService: MiniWidgetService,
    @Inject('widgetId') widgetId: number
  ) {
    this.body = null;
    this.editComponent = null;
    this.mode = this.widgetData ? ModeEnum.READ : ModeEnum.EDIT;
    this.widgetId = widgetId;
  }

  public ngOnInit(): void {
    console.log('ng on init mini widget ' + JSON.stringify(this.widgetData));
    this.mode = this.widgetData ? ModeEnum.READ : ModeEnum.EDIT;
    this.refreshWidget();
    this.refreshInterval = setInterval(this.refreshWidget.bind(this), this.refreshTimeout);
  }

  public ngOnDestroy(): void {
    if (this.refreshInterval) {
      console.log('clearInterval ' + JSON.stringify(this.widgetData));
      clearInterval(this.refreshInterval);
    }
  }

  public onValidation(): void {
    this.miniWidgetService
      .updateWidgetData(this.widgetId, {
        ...this.widgetData
      })
      .subscribe({
        next: (data: unknown) => {
          // Emit onDataChanged()
          this.toReadMode();
          this.refreshWidget();
        },
        error: (error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_UPDATING_WIDGET_DATA)
      });
  }

  public refreshWidget(): void {
    console.log('Refresh widget ' + JSON.stringify(this.widgetData));
    this.refreshWidgetAction.emit();
  }

  public toEditMode(): void {
    this.mode = this.editComponent ? ModeEnum.EDIT : this.mode;
  }

  public toReadMode(): void {
    this.mode = ModeEnum.READ;
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
