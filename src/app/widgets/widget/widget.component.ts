import { WidgetService } from 'src/app/services/widget.service/widget.service';
import { ModeEnum } from './../../enums/ModeEnum';
import {
  Component,
  ContentChild,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  OnInit,
  Inject,
  SimpleChanges,
  OnChanges
} from '@angular/core';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent implements OnInit, OnChanges {
  @ContentChild('header', { static: false })
  header: TemplateRef<any> | null;

  @ContentChild('body', { static: false })
  body: TemplateRef<any> | null;

  @ContentChild('editComponent', { static: false })
  editComponent: TemplateRef<any> | null;

  public widgetId: number;

  @Input() isFormValid = false;
  @Input() widgetData: Record<string, unknown> | null = null;
  @Output() refreshWidgetAction = new EventEmitter();

  public mode: ModeEnum;

  constructor(private widgetService: WidgetService, @Inject('widgetId') widgetId: number) {
    this.header = null;
    this.body = null;
    this.editComponent = null;
    this.mode = this.widgetData ? ModeEnum.READ : ModeEnum.EDIT;
    this.widgetId = widgetId;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['widgetData']) {
      console.log(changes['widgetData'].currentValue);
    }
    if (changes['widgetData'].currentValue && this.mode !== ModeEnum.DELETE) {
      this.mode = ModeEnum.READ;
    }
  }

  public ngOnInit(): void {
    this.refreshWidget();
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
        error: (error) => console.error(error.message)
      });
  }

  public deleteWidget = () => this.widgetService._widgetDeletedEvent.next(this.widgetId);

  public refreshWidget = () => this.refreshWidgetAction.emit();
  public toEditMode = () => (this.mode = ModeEnum.EDIT);
  public toReadMode = () => (this.mode = ModeEnum.READ);
  public toDeleteMode = () => (this.mode = ModeEnum.DELETE);
  public isModeRead = (): boolean => this.mode === ModeEnum.READ;
  public isModeEdit = (): boolean => this.mode === ModeEnum.EDIT;
  public isModeDelete = (): boolean => this.mode === ModeEnum.DELETE;
}
