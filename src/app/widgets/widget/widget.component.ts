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
import { ErrorHandlerService } from '../../../app/services/error.handler.service';
import { WidgetService } from '../../../app/services/widget.service/widget.service';
import { ModeEnum } from './../../enums/ModeEnum';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent implements OnInit, OnDestroy {
  @ContentChild('header', { static: false })
  header: TemplateRef<unknown> | null;

  @ContentChild('additionalActions', { static: false })
  additionalActions: TemplateRef<unknown> | null;

  @ContentChild('body', { static: false })
  body: TemplateRef<unknown> | null;

  @ContentChild('editComponent', { static: false })
  editComponent: TemplateRef<unknown> | null;

  public widgetId: number;

  @Input() isFormValid = false;
  @Input() isWidgetLoaded = false;
  @Input() widgetData: Record<string, unknown> | null = null;
  @Output() refreshWidgetAction = new EventEmitter();

  public mode: ModeEnum;

  private timeoutRefresh: NodeJS.Timer | null = null;

  private ERROR_UPDATING_WIDGET_DATA =
    'Erreur lors de la mise à jour de la configuration du widget.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    private widgetService: WidgetService,
    @Inject('widgetId') widgetId: number
  ) {
    this.header = null;
    this.additionalActions = null;
    this.body = null;
    this.editComponent = null;
    this.mode = this.widgetData ? ModeEnum.READ : ModeEnum.EDIT;
    this.widgetId = widgetId;
  }

  public ngOnInit(): void {
    this.mode = this.widgetData ? ModeEnum.READ : ModeEnum.EDIT;
    this.refreshWidget();
    this.timeoutRefresh = setInterval(this.refreshWidget, 300000);
  }

  public ngOnDestroy(): void {
    if (this.timeoutRefresh) {
      clearInterval(this.timeoutRefresh);
    }
  }

  public onValidation() {
    this.widgetService
      .updateWidgetData(this.widgetId, {
        ...this.widgetData
      })
      .subscribe({
        next: (data: unknown) => {
          // Emit onDataChanged()
          this.mode = ModeEnum.READ;
          this.refreshWidget();
        },
        error: (error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_UPDATING_WIDGET_DATA)
      });
  }

  public deleteWidget = () => this.widgetService._widgetDeletedEvent.next(this.widgetId);

  public refreshWidget = () => this.refreshWidgetAction.emit();
  public toEditMode = () => (this.mode = this.editComponent ? ModeEnum.EDIT : this.mode);
  public toReadMode = () => (this.mode = ModeEnum.READ);
  public toDeleteMode = () => (this.mode = ModeEnum.DELETE);
  public isModeRead = (): boolean => this.mode === ModeEnum.READ;
  public isModeEdit = (): boolean => this.mode === ModeEnum.EDIT;
  public isModeDelete = (): boolean => this.mode === ModeEnum.DELETE;
}
