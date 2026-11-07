import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal } from "@angular/core";
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

  private readonly ERROR_MESSAGES = {
    startingNewStreak: "Erreur lors du démarrage de la série.",
    endingNewStreak: "Erreur lors de la clôture de la série.",
    gettingIncidentConfig: "Erreur lors de la récupération de l'incident.",
    gettingIncidentStreaks: "Erreur lors de la récupération des séries."
  };

  public readonly config = signal({ incidentName: injectWidgetData("incidentName", "") });
  public readonly configForm = form(this.config, (path) => requiredText(path.incidentName));
  private readonly widgetView = signal(IncidentView.CURRENT_STREAK);
  // A new object on each refresh, so that the resources reload
  private readonly refreshRequest = signal<object | undefined>(undefined);

  /** Incident configuration of the widget, reloaded on each refresh, or set when a streak is started or ended. */
  private readonly incidentConfigResource = rxResource({
    params: () => this.refreshRequest(),
    stream: () =>
      this.incidentWidgetService.getIncidentConfigForWidget(this.widgetId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingIncidentConfig);
          return of(undefined);
        })
      ),
    defaultValue: undefined as Incident | undefined
  });

  /** Past streaks of the incident, most recent first, reloaded with each new incident configuration. */
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
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingIncidentStreaks);
          return of([]);
        })
      ),
    defaultValue: [] as IncidentStreak[]
  });

  public readonly streaks = this.streaksResource.value;
  public readonly lastIncidentDate = computed(
    () => this.incidentConfigResource.value()?.lastIncidentDate
  );
  public readonly isWidgetLoaded = computed(() =>
    isResourceLoaded(this.incidentConfigResource.status())
  );
  public readonly isWidgetViewCurrentStreak = computed(
    () => this.widgetView() === IncidentView.CURRENT_STREAK
  );
  private readonly isWidgetViewPastStreaks = computed(
    () => this.widgetView() === IncidentView.PAST_STREAKS
  );
  public readonly isFormValid = computed(() => this.configForm().valid());
  public readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));
  public readonly daysSinceLastIncident = computed(() => {
    const lastIncidentDate = this.lastIncidentDate();
    return lastIncidentDate ? differenceInDays(new Date(), Date.parse(lastIncidentDate)) : 0;
  });

  private readonly dialog = inject(MatDialog);
  private readonly incidentWidgetService = inject(IncidentWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly widgetId = inject(WIDGET_ID);
  // Configuration of the last refresh, restored when the edition is cancelled
  private savedConfig = this.config();

  public refreshWidget(): void {
    this.savedConfig = this.config();
    this.refreshRequest.set({});
  }

  public restoreSavedConfig(): void {
    this.config.set(this.savedConfig);
  }

  public startNewStreak(): void {
    this.incidentWidgetService.startFirstStreak(this.widgetId).subscribe({
      // Also loads the streaks of an incident created by this first streak
      next: (updatedIncidentConfig) => this.incidentConfigResource.set(updatedIncidentConfig),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.startingNewStreak)
    });
  }

  public openEndStreakModal(): void {
    this.dialog
      .open<ConfirmModal, ConfirmModalData, boolean>(ConfirmModal, {
        width: "600px",
        data: { confirmMessage: "Êtes-vous sûr de vouloir clôturer cette série ?" }
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.endCurrentStreak());
  }

  public goToCurrentStreakView(): void {
    this.widgetView.set(IncidentView.CURRENT_STREAK);
  }

  public goToPastStreaksView(): void {
    this.widgetView.set(IncidentView.PAST_STREAKS);
  }

  public getNumberOfDaysFromStreak(streakStartDate: string, streakEndDate: string): number {
    return differenceInDays(Date.parse(streakEndDate), Date.parse(streakStartDate));
  }

  private endCurrentStreak(): void {
    this.incidentWidgetService.endStreak(this.widgetId).subscribe({
      // The streaks are reloaded with the new configuration: the ended streak is now a past one
      next: (updatedIncidentConfig) => this.incidentConfigResource.set(updatedIncidentConfig),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.endingNewStreak)
    });
  }
}
