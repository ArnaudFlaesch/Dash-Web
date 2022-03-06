import { WidgetService } from './../../services/widget.service/widget.service';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-delete-widget',
  templateUrl: './delete-widget.component.html',
  styleUrls: ['./delete-widget.component.scss']
})
export class DeleteWidgetComponent {
  @Output() validateWidgetDeletion = new EventEmitter();
  @Output() cancelWidgetDeletion = new EventEmitter();

  constructor(private widgetService: WidgetService) {}

  cancelButtonClicked() {
    this.cancelWidgetDeletion.emit();
  }

  public deleteWidget() {
    this.validateWidgetDeletion.emit();
  }
}
