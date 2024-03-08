import { Component, ContentChild, Inject, TemplateRef } from '@angular/core';

import { ErrorHandlerService } from '../../../app/services/error.handler.service';
import { WidgetService } from '../../../app/services/widget.service/widget.service';
import { AbstractWidgetComponent } from '../abstract-widget/abstract-widget.component';

@Component({
  selector: 'dash-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent extends AbstractWidgetComponent {
  @ContentChild('headerIcon', { static: false })
  headerIcon: TemplateRef<unknown> | null = null;

  @ContentChild('headerTitle', { static: false })
  headerTitle: TemplateRef<unknown> | null = null;

  @ContentChild('additionalActions', { static: false })
  additionalActions: TemplateRef<unknown> | null = null;

  private ERROR_UPDATING_WIDGET_DATA =
    'Erreur lors de la mise à jour de la configuration du widget.';

  constructor(
    private errorHandlerService: ErrorHandlerService,
    protected override widgetService: WidgetService,
    @Inject('widgetId') widgetId: number
  ) {
    super(widgetService, widgetId);
  }

  public onValidation(): void {
    this.widgetService
      .updateWidgetData(this.widgetId, {
        ...this.widgetData
      })
      .subscribe({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        next: (data: unknown) => {
          this.toReadMode();
          this.refreshWidget();
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_UPDATING_WIDGET_DATA)
      });
  }

  public deleteWidget(): void {
    this.widgetService._widgetDeletedEvent.next(this.widgetId);
  }
}
