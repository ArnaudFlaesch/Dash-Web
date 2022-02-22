import { ModeEnum } from './../../enums/ModeEnum';
import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent {
  @ContentChild('header', { static: false })
  header: TemplateRef<any> | null;

  @ContentChild('body', { static: false })
  body: TemplateRef<any> | null;

  @ContentChild('editComponent', { static: false })
  editComponent: TemplateRef<any> | null;

  @Input() isFormValid = false;
  @Output() refreshWidgetAction = new EventEmitter();
  @Output() onValidationEmitter = new EventEmitter();

  public mode: ModeEnum;

  constructor() {
    this.header = null;
    this.body = null;
    this.editComponent = null;
    this.mode = ModeEnum.READ;
  }

  public onValidation() {
    this.onValidationEmitter.emit();
    this.mode = ModeEnum.READ;
  }

  public refreshWidget() {
    this.refreshWidgetAction.emit();
  }

  public editWidget() {
    this.mode = ModeEnum.EDIT;
  }

  public cancelDeletion() {
    this.mode = ModeEnum.READ;
  }

  public deleteWidget() {
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
