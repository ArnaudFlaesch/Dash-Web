import { Component, Inject, OnInit } from '@angular/core';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { IncidentWidgetService } from './incident.widget.service';

@Component({
  selector: 'app-incident-widget',
  templateUrl: './incident-widget.component.html',
  styleUrls: ['./incident-widget.component.scss']
})
export class IncidentWidgetComponent {
  public incidentName?: string;
  public lastIncidentDate?: string;
  public streaks: { startDate: string; endDate: string }[] = [];

  public isWidgetLoaded = false;

  private ERROR_GETTING_WIDGET_CONFIG =
    'Erreur lors de la récupération de la configuration du widget.';
  private ERROR_UPDATING_WIDGET_CONFIG = 'Erreur lors de la mise à jour du widget.';

  constructor(
    private incidentWidgetService: IncidentWidgetService,
    private errorHandlerService: ErrorHandlerService,
    @Inject('widgetId') private widgetId: number
  ) {}

  public refreshWidget(): void {
    this.isWidgetLoaded = false;
    this.incidentWidgetService.getIncidentConfigForWidget(this.widgetId).subscribe({
      next: (incidentConfig) => {
        this.lastIncidentDate = incidentConfig.lastIncidentDate;
        this.isWidgetLoaded = true;
      },
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_WIDGET_CONFIG)
    });
  }

  public startNewStreak(): void {
    this.incidentWidgetService.startFirstStreak(this.widgetId).subscribe({
      next: (updatedIncidentConfig) =>
        (this.lastIncidentDate = updatedIncidentConfig.lastIncidentDate),
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_UPDATING_WIDGET_CONFIG)
    });
  }

  public endCurrentStreak(): void {
    this.incidentWidgetService.endStreak(this.widgetId).subscribe({
      next: (updatedIncidentConfig) =>
        (this.lastIncidentDate = updatedIncidentConfig.lastIncidentDate),
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_UPDATING_WIDGET_CONFIG)
    });
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
}
