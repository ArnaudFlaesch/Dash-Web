import { Component, Inject } from '@angular/core';

import { AbstractWidgetComponent } from '../abstract-widget/abstract-widget.component';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { MiniWidgetService } from '../../services/widget.service/miniwidget.service';
import { WidgetService } from '../../services/widget.service/widget.service';

@Component({
  selector: 'app-mini-widget',
  templateUrl: './mini-widget.component.html',
  styleUrls: ['./mini-widget.component.scss']
})
export class MiniWidgetComponent extends AbstractWidgetComponent {
  private ERROR_UPDATING_WIDGET_DATA =
    'Erreur lors de la mise à jour de la configuration du widget.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    protected override widgetService: WidgetService,
    private miniWidgetService: MiniWidgetService,
    @Inject('widgetId') widgetId: number
  ) {
    super(widgetService, widgetId);
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
}
