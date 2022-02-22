import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-delete-widget',
  templateUrl: './delete-widget.component.html',
  styleUrls: ['./delete-widget.component.scss']
})
export class DeleteWidgetComponent {
  @Output() cancelWidgetDeletion = new EventEmitter();

  cancelButtonClicked() {
    this.cancelWidgetDeletion.emit();
  }
}
