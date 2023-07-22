import { Component, Inject } from '@angular/core';

import { ErrorHandlerService } from '../../services/error.handler.service';
import { IIncidentStreak, IIncidentViewEnum } from './IIncident';
import { IncidentWidgetService } from './incident.widget.service';
import { intervalToDuration } from 'date-fns';

@Component({
  selector: 'app-incident-widget',
  templateUrl: './incident-widget.component.html',
  styleUrls: ['./incident-widget.component.scss']
})
export class IncidentWidgetComponent {
  public incidentId?: number;
  public incidentName?: string;
  public lastIncidentDate?: string;
  public streaks: IIncidentStreak[] = [];
  public isWidgetLoaded = false;

  private widgetView: IIncidentViewEnum = IIncidentViewEnum.CURRENT_STREAK;

  private ERROR_GETTING_WIDGET_CONFIG =
    'Erreur lors de la récupération de la configuration du widget.';
  private ERROR_UPDATING_WIDGET_CONFIG = 'Erreur lors de la mise à jour du widget.';
  private ERROR_GETTING_INCIDENT_STREAKS = 'Erreur lors de la récupération des séries.';

  constructor(
    private incidentWidgetService: IncidentWidgetService,
    private errorHandlerService: ErrorHandlerService,
    @Inject('widgetId') private widgetId: number
  ) {}

  public refreshWidget(): void {
    this.isWidgetLoaded = false;
    this.incidentWidgetService.getIncidentConfigForWidget(this.widgetId).subscribe({
      next: (incidentConfig) => {
        this.incidentId = incidentConfig.id;
        this.lastIncidentDate = incidentConfig.lastIncidentDate;
        this.isWidgetLoaded = true;
        this.getIncidentStreaks(this.incidentId);
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

  public goToCurrentStreakView(): void {
    if (!this.isWidgetViewCurrentStreak()) {
      this.widgetView = IIncidentViewEnum.CURRENT_STREAK;
    }
  }

  public goToPastStreaksView(): void {
    if (!this.isWidgetViewPastStreaks()) {
      this.widgetView = IIncidentViewEnum.PAST_STREAKS;
    }
  }

  public getNumberOfDaysFromStreak(streak: IIncidentStreak): Duration {
    return intervalToDuration({
      start: Date.parse(streak.streakStartDate),
      end: Date.parse(streak.streakEndDate)
    });
  }

  public isWidgetViewCurrentStreak(): boolean {
    return this.widgetView === IIncidentViewEnum.CURRENT_STREAK;
  }

  public isWidgetViewPastStreaks(): boolean {
    return this.widgetView === IIncidentViewEnum.PAST_STREAKS;
  }

  public getWidgetConfig(): { incidentName: string } | undefined {
    return this.incidentName ? { incidentName: this.incidentName } : undefined;
  }

  public isFormValid(): boolean {
    return this.incidentName !== undefined && this.incidentName.length > 0;
  }

  private getIncidentStreaks(incidentId: number): void {
    this.incidentWidgetService.getIncidentStreaks(incidentId).subscribe({
      next: (incidentStreaks) => (this.streaks = incidentStreaks),
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_GETTING_INCIDENT_STREAKS)
    });
  }
}
