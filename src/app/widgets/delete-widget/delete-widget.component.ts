import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'dash-delete-widget',
  templateUrl: './delete-widget.component.html',
  styleUrls: ['./delete-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButton]
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
