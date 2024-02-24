import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'dash-delete-widget',
  templateUrl: './delete-widget.component.html',
  styleUrls: ['./delete-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteWidgetComponent {
  @Output() validateWidgetDeletion = new EventEmitter();
  @Output() cancelWidgetDeletion = new EventEmitter();

  cancelButtonClicked(): void {
    this.cancelWidgetDeletion.emit();
  }

  public deleteWidget(): void {
    this.validateWidgetDeletion.emit();
  }
}
