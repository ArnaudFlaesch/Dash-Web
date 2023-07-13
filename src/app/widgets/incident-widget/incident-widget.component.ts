import { Component, Inject } from '@angular/core';
import { WidgetService } from '../../services/widget.service/widget.service';
import { ErrorHandlerService } from 'src/app/services/error.handler.service';

@Component({
  selector: 'app-incident-widget',
  templateUrl: './incident-widget.component.html',
  styleUrls: ['./incident-widget.component.scss']
})
export class IncidentWidgetComponent {
  public incidentName?: string;
  public lastIncidentDate?: string;
  public streaks: { startDate: string; endDate: string }[] = [];

  public isWidgetLoaded = true;

  private ERROR_UPDATING_WIDGET = 'Erreur lors de la mise à jour du widget.';

  constructor(
    private widgetService: WidgetService,
    private errorHandlerService: ErrorHandlerService,
    @Inject('widgetId') private widgetId: number
  ) {}

  public startNewStreak(): void {
    const newWidgetConfig = { ...this.getWidgetConfig(), lastIncidentDate: new Date() };
    this.updateWidgetConfig(newWidgetConfig);
  }

  public endCurrentStreak(): void {
    if (this.lastIncidentDate) {
      const streaks: { startDate: string; endDate: string }[] = [
        ...this.streaks,
        {
          startDate: new Date(this.lastIncidentDate).toString(),
          endDate: new Date().toString()
        } as { startDate: string; endDate: string }
      ];
      const newWidgetConfig = {
        ...this.getWidgetConfig(),
        streaks: streaks,
        lastIncidentDate: new Date()
      };
      this.updateWidgetConfig(newWidgetConfig);
    }
  }

  public getWidgetConfig():
    | {
        incidentName: string;
        lastIncidentDate?: string;
      }
    | undefined {
    return this.incidentName
      ? { incidentName: this.incidentName, lastIncidentDate: this.lastIncidentDate }
      : undefined;
  }

  public isFormValid(): boolean {
    return this.incidentName !== undefined && this.incidentName.length > 0;
  }

  private updateWidgetConfig(newWidgetConfig: any): void {
    this.widgetService.updateWidgetData(this.widgetId, newWidgetConfig).subscribe({
      next: (widgetConfig) => {
        this.lastIncidentDate = widgetConfig.data?.['lastIncidentDate'] as string;
        this.streaks = widgetConfig.data?.['streaks'] as { startDate: string; endDate: string }[];
      },
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_UPDATING_WIDGET)
    });
  }
}
