import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, linkedSignal, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";

import { isResourceLoaded } from "@shared/resources/resource-status";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { Incident, IncidentStreak, IncidentView } from "./incident";
import { IncidentWidgetService } from "./incident-widget-service";
import { differenceInDays } from "date-fns";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmModal } from "@shared/confirm-modal/confirm-modal";
import { DateFormatPipe } from "@shared/dates/date-format-pipe";
import { MatButton } from "@angular/material/button";

import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "@shared/forms/form-validators";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { Widget } from "@widgets/widget/widget";
import { injectWidgetData, WIDGET_ID } from "@widgets/widget-tokens";
import { catchError, filter, map, of } from "rxjs";
import { ConfirmModalData } from "@shared/confirm-modal/confirm-modal-data";

@Component({
  selector: "dash-incident-widget",
  templateUrl: "./incident-widget.html",
  styleUrl: "./incident-widget.scss",
  imports: [Widget, MatIcon, MatFormField, MatLabel, MatInput, FormField, MatButton, DateFormatPipe]
})
export class IncidentWidget {
  protected readonly labels = {
    incident: "Incident",
    incidentType: "Type d'incident",
    incidentTypePlaceholder: "Saisissez le type d'incident",
    lastIncidentOn: "Dernier incident le",
    pastStreaks: "Séries précédentes",
    days: "jours",
    end: "Terminer",
    currentStreak: "Série actuelle",
    start: "Départ"
  };

  protected readonly config = signal({ incidentName: injectWidgetData("incidentName", "") });
  protected readonly configForm = form(this.config, (path) => requiredText(path.incidentName));

  /** Incident configuration of the widget, reloaded on each refresh. */
  private readonly incidentConfigResource = rxResource({
    params: () => this.refreshRequest(),
    stream: () =>
      this.incidentWidgetService.getIncidentConfigForWidget(this.widgetId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_INCIDENT_STREAKS);
          return of(undefined);
        })
      ),
    defaultValue: undefined as Incident | undefined
  });

  /** Past streaks of the incident, most recent first, reloaded with the incident configuration. */
  private readonly streaksResource = rxResource({
    params: () => this.incidentConfigResource.value(),
    stream: ({ params: incidentConfig }) =>
      this.incidentWidgetService.getIncidentStreaks(incidentConfig.id).pipe(
        map((incidentStreaks) =>
          incidentStreaks.toSorted(
            (streakA, streakB) =>
              Date.parse(streakB.streakEndDate) - Date.parse(streakA.streakEndDate)
          )
        ),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_INCIDENT_STREAKS);
          return of([]);
        })
      ),
    defaultValue: [] as IncidentStreak[]
  });

  protected readonly streaks = this.streaksResource.value;
  // Also updated when a streak is started or ended
  protected readonly lastIncidentDate = linkedSignal(
    () => this.incidentConfigResource.value()?.lastIncidentDate
  );
  protected readonly isWidgetLoaded = computed(() =>
    isResourceLoaded(this.incidentConfigResource.status())
  );

  protected readonly isWidgetViewCurrentStreak = computed(
    () => this.widgetView() === IncidentView.CURRENT_STREAK
  );
  private readonly isWidgetViewPastStreaks = computed(
    () => this.widgetView() === IncidentView.PAST_STREAKS
  );
  protected readonly isFormValid = computed(() => this.configForm().valid());
  protected readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));
  protected readonly daysSinceLastIncident = computed(() => {
    const lastIncidentDate = this.lastIncidentDate();
    return lastIncidentDate ? differenceInDays(new Date(), Date.parse(lastIncidentDate)) : 0;
  });

  private readonly widgetView = signal(IncidentView.CURRENT_STREAK);
  // A new object on each refresh, so that the resources reload
  private readonly refreshRequest = signal<object | undefined>(undefined);

  private readonly ERROR_STARTING_NEW_STREAK = "Erreur lors du démarrage de la série.";
  private readonly ERROR_ENDING_NEW_STREAK = "Erreur lors de la clôture de la série.";
  private readonly ERROR_GETTING_INCIDENT_STREAKS = "Erreur lors de la récupération des séries.";

  private readonly dialog = inject(MatDialog);
  private readonly incidentWidgetService = inject(IncidentWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly widgetId = inject(WIDGET_ID);

  protected refreshWidget(): void {
    this.refreshRequest.set({});
  }

  protected startNewStreak(): void {
    this.incidentWidgetService.startFirstStreak(this.widgetId).subscribe({
      next: (updatedIncidentConfig) =>
        this.lastIncidentDate.set(updatedIncidentConfig.lastIncidentDate),
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_STARTING_NEW_STREAK)
    });
  }

  protected openEndStreakModal(): void {
    this.dialog
      .open<ConfirmModal, ConfirmModalData, boolean>(ConfirmModal, {
        width: "600px",
        data: { confirmMessage: "Êtes-vous sûr de vouloir clôturer cette série ?" }
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.endCurrentStreak());
  }

  protected goToCurrentStreakView(): void {
    this.widgetView.set(IncidentView.CURRENT_STREAK);
  }

  protected goToPastStreaksView(): void {
    this.widgetView.set(IncidentView.PAST_STREAKS);
  }

  protected getNumberOfDaysFromStreak(streakStartDate: string, streakEndDate: string): number {
    return differenceInDays(Date.parse(streakEndDate), Date.parse(streakStartDate));
  }

  private endCurrentStreak(): void {
    this.incidentWidgetService.endStreak(this.widgetId).subscribe({
      next: (updatedIncidentConfig) => {
        this.lastIncidentDate.set(updatedIncidentConfig.lastIncidentDate);
        // The ended streak is saved as a past streak
        this.streaksResource.reload();
      },
      error: (error) => this.errorHandlerService.handleError(error, this.ERROR_ENDING_NEW_STREAK)
    });
  }
}
