import {
  Component,
  ContentChild,
  EventEmitter,
  Inject,
  Input,
  Output,
  TemplateRef
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ModeEnum } from '../../enums/ModeEnum';
import { WidgetService } from '../../services/widget.service/widget.service';

@Component({
  selector: 'app-abstract-widget',
  templateUrl: './abstract-widget.component.html',
  styleUrls: ['./abstract-widget.component.scss']
})
export class AbstractWidgetComponent {
  @ContentChild('body', { static: false })
  body: TemplateRef<unknown> | null = null;

  @ContentChild('editComponent', { static: false })
  editComponent: TemplateRef<unknown> | null = null;

  @Input() isFormValid = false;
  @Input() isWidgetLoaded = false;
  @Input() widgetData: Record<string, unknown> | undefined;
  @Output() refreshWidgetAction = new EventEmitter();

  public widgetId: number;
  public mode: ModeEnum;

  private destroy$: Subject<unknown> = new Subject();

  constructor(
    protected widgetService: WidgetService,
    @Inject('widgetId') widgetId: number
  ) {
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

  public refreshWidget(): void {
    console.log('Refresh widget ' + JSON.stringify(this.widgetData));
    if (this.isFormValid) {
      this.refreshWidgetAction.emit();
    }
  }

  public toEditMode(): void {
    this.mode = this.editComponent ? ModeEnum.EDIT : this.mode;
  }

  public toReadMode(): void {
    if (this.widgetData) {
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
