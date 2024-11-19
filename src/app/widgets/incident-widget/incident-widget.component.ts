import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef } from "@angular/core";

import { ErrorHandlerService } from "../../services/error.handler.service";
import { IIncidentStreak, IIncidentViewEnum } from "./IIncident";
import { IncidentWidgetService } from "./incident.widget.service";
import { differenceInDays } from "date-fns";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmModalComponent } from "../../modals/confirm-modal/confirm-modal.component";
import { DateFormatPipe } from "../../pipes/date-format.pipe";
import { MatButton } from "@angular/material/button";

import { FormsModule } from "@angular/forms";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { WidgetComponent } from "../widget/widget.component";
import { switchMap } from "rxjs";

@Component({
  selector: "dash-incident-widget",
  templateUrl: "./incident-widget.component.html",
  styleUrls: ["./incident-widget.component.scss"],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    WidgetComponent,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatButton,
    DateFormatPipe
  ]
})
export class IncidentWidgetComponent {
  public incidentId?: number;
  public incidentName?: string;
  public lastIncidentDate?: string;
  public streaks: IIncidentStreak[] = [];
  public isWidgetLoaded = false;

  private widgetView: IIncidentViewEnum = IIncidentViewEnum.CURRENT_STREAK;

  private readonly ERROR_STARTING_NEW_STREAK = "Erreur lors du démarrage de la série.";
  private readonly ERROR_ENDING_NEW_STREAK = "Erreur lors de la clôture de la série.";
  private readonly ERROR_GETTING_INCIDENT_STREAKS = "Erreur lors de la récupération des séries.";

  private readonly dialog = inject(MatDialog);
  private readonly incidentWidgetService = inject(IncidentWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly widgetId = inject<number>("widgetId" as never);

  public refreshWidget(): void {
    this.isWidgetLoaded = false;
    this.incidentWidgetService
      .getIncidentConfigForWidget(this.widgetId)
      .pipe(
        switchMap((incidentConfig) => {
          this.incidentId = incidentConfig.id;
          this.lastIncidentDate = incidentConfig.lastIncidentDate;
          this.isWidgetLoaded = true;
          return this.incidentWidgetService.getIncidentStreaks(this.incidentId);
        })
      )
      .subscribe({
        next: (incidentStreaks) =>
          (this.streaks = incidentStreaks
            .slice()
            .sort(
              (streakA: IIncidentStreak, streakB: IIncidentStreak) =>
                Date.parse(streakB.streakEndDate) - Date.parse(streakA.streakEndDate)
            )),
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_INCIDENT_STREAKS),
        complete: () => this.changeDetectorRef.detectChanges()
      });
  }

  public startNewStreak(): void {
    this.incidentWidgetService.startFirstStreak(this.widgetId).subscribe({
      next: (updatedIncidentConfig) =>
        (this.lastIncidentDate = updatedIncidentConfig.lastIncidentDate),
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_STARTING_NEW_STREAK)
    });
  }

  public openEndStreakModal(): void {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      height: "400px",
      width: "600px",
      data: { confirmMessage: "Êtes-vous sûr de vouloir clôturer cette série ?" }
    });

    dialogRef.afterClosed().subscribe((choice: string) => {
      if (choice === "ok") {
        this.endCurrentStreak();
      }
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

  public getDaysSinceLastIncident(): number {
    if (!this.lastIncidentDate) return 0;
    return differenceInDays(new Date(), Date.parse(this.lastIncidentDate));
  }

  public getNumberOfDaysFromStreak(streakStartDate: string, streakEndDate: string): number {
    return differenceInDays(Date.parse(streakEndDate), Date.parse(streakStartDate));
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
    return (this.incidentName ?? "").length > 0;
  }

  private endCurrentStreak(): void {
    this.incidentWidgetService.endStreak(this.widgetId).subscribe({
      next: (updatedIncidentConfig) =>
        (this.lastIncidentDate = updatedIncidentConfig.lastIncidentDate),
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_ENDING_NEW_STREAK)
    });
  }
}
