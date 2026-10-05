import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  WritableSignal
} from "@angular/core";

import { ErrorHandlerService } from "../../services/error.handler.service";
import { IIncidentStreak, IIncidentViewEnum } from "./IIncident";
import { IncidentWidgetService } from "./incident.widget.service";
import { differenceInDays } from "date-fns";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmModalComponent } from "../../modals/confirm-modal/confirm-modal.component";
import { DateFormatPipe } from "../../pipes/date-format.pipe";
import { MatButton } from "@angular/material/button";

import { FormField, form } from "@angular/forms/signals";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { WidgetComponent } from "../widget/widget.component";
import { switchMap } from "rxjs";

@Component({
  selector: "dash-incident-widget",
  templateUrl: "./incident-widget.component.html",
  styleUrls: ["./incident-widget.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WidgetComponent,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    FormField,
    MatButton,
    DateFormatPipe
  ]
})
export class IncidentWidgetComponent {
  public readonly incidentName = signal<string>("");
  public readonly incidentNameForm = form(this.incidentName);
  public lastIncidentDate = signal<string | undefined>(undefined);
  public streaks: WritableSignal<IIncidentStreak[]> = signal([]);
  public isWidgetLoaded = signal(false);

  public readonly isWidgetViewCurrentStreak = computed(
    () => this.widgetView() === IIncidentViewEnum.CURRENT_STREAK
  );
  public readonly isWidgetViewPastStreaks = computed(
    () => this.widgetView() === IIncidentViewEnum.PAST_STREAKS
  );
  public readonly isFormValid = computed(() => this.incidentName().trim().length > 0);
  public readonly daysSinceLastIncident = computed(() => {
    const lastIncidentDate = this.lastIncidentDate();
    if (!lastIncidentDate) return 0;
    return differenceInDays(new Date(), Date.parse(lastIncidentDate));
  });

  private readonly widgetView = signal(IIncidentViewEnum.CURRENT_STREAK);

  private readonly ERROR_STARTING_NEW_STREAK = "Erreur lors du démarrage de la série.";
  private readonly ERROR_ENDING_NEW_STREAK = "Erreur lors de la clôture de la série.";
  private readonly ERROR_GETTING_INCIDENT_STREAKS = "Erreur lors de la récupération des séries.";

  private readonly dialog = inject(MatDialog);
  private readonly incidentWidgetService = inject(IncidentWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly widgetId = inject<number>("widgetId" as never);

  public refreshWidget(): void {
    this.isWidgetLoaded.set(false);
    this.incidentWidgetService
      .getIncidentConfigForWidget(this.widgetId)
      .pipe(
        switchMap((incidentConfig) => {
          this.lastIncidentDate.set(incidentConfig.lastIncidentDate);
          this.isWidgetLoaded.set(true);
          return this.incidentWidgetService.getIncidentStreaks(incidentConfig.id);
        })
      )
      .subscribe({
        next: (incidentStreaks) =>
          this.streaks.set(
            incidentStreaks
              .slice()
              .sort(
                (streakA: IIncidentStreak, streakB: IIncidentStreak) =>
                  Date.parse(streakB.streakEndDate) - Date.parse(streakA.streakEndDate)
              )
          ),
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_INCIDENT_STREAKS)
      });
  }

  public startNewStreak(): void {
    this.incidentWidgetService.startFirstStreak(this.widgetId).subscribe({
      next: (updatedIncidentConfig) =>
        this.lastIncidentDate.set(updatedIncidentConfig.lastIncidentDate),
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
      this.widgetView.set(IIncidentViewEnum.CURRENT_STREAK);
    }
  }

  public goToPastStreaksView(): void {
    if (!this.isWidgetViewPastStreaks()) {
      this.widgetView.set(IIncidentViewEnum.PAST_STREAKS);
    }
  }

  public getDaysSinceLastIncident(): number {
    return this.daysSinceLastIncident();
  }

  public getNumberOfDaysFromStreak(streakStartDate: string, streakEndDate: string): number {
    return differenceInDays(Date.parse(streakEndDate), Date.parse(streakStartDate));
  }

  public getWidgetConfig(): { incidentName: string } | undefined {
    const incidentName = this.incidentName();
    return incidentName ? { incidentName } : undefined;
  }

  private endCurrentStreak(): void {
    this.incidentWidgetService.endStreak(this.widgetId).subscribe({
      next: (updatedIncidentConfig) =>
        this.lastIncidentDate.set(updatedIncidentConfig.lastIncidentDate),
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_ENDING_NEW_STREAK)
    });
  }
}
