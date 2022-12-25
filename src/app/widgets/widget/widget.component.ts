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
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

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

  @Input() isFormValid = false;
  @Input() isWidgetLoaded = false;
  @Input() widgetData: Record<string, unknown> | undefined;
  @Output() refreshWidgetAction = new EventEmitter();

  public widgetId: number;
  public mode: ModeEnum;

  private destroy$: Subject<unknown> = new Subject();

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

  ngOnInit(): void {
    console.log('ng on init widget ' + JSON.stringify(this.widgetData));
    this.mode = this.widgetData ? ModeEnum.READ : ModeEnum.EDIT;
    this.refreshWidget();
    this.widgetService.refreshWidgetsAction.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.refreshWidget()
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  public onValidation(): void {
    this.widgetService
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

  public deleteWidget(): void {
    this.widgetService._widgetDeletedEvent.next(this.widgetId);
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
