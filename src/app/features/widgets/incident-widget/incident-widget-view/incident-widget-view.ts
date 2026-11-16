import { Component, computed, input, output, signal } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { differenceInDays } from "date-fns";
import { DateFormatPipe } from "@shared/dates/date-format-pipe";
import { IncidentStreak, IncidentView } from "../incident";

@Component({
  selector: "dash-incident-widget-view",
  templateUrl: "./incident-widget-view.html",
  styleUrl: "./incident-widget-view.scss",
  imports: [MatButton, DateFormatPipe]
})
export class IncidentWidgetView {
  protected readonly labels = {
    lastIncidentOn: "Dernier incident le",
    pastStreaks: "Séries précédentes",
    days: "jours",
    end: "Terminer",
    currentStreak: "Série actuelle",
    start: "Départ"
  };

  /** Date of the last incident, undefined when the incident has never happened. */
  public readonly lastIncidentDate = input.required<string | undefined>();
  /** Past streaks of the incident, most recent first. */
  public readonly streaks = input.required<IncidentStreak[]>();
  public readonly newStreakRequested = output();
  public readonly streakEndRequested = output();

  private readonly widgetView = signal(IncidentView.CURRENT_STREAK);

  public readonly isWidgetViewCurrentStreak = computed(
    () => this.widgetView() === IncidentView.CURRENT_STREAK
  );
  public readonly daysSinceLastIncident = computed(() => {
    const lastIncidentDate = this.lastIncidentDate();
    return lastIncidentDate ? differenceInDays(new Date(), Date.parse(lastIncidentDate)) : 0;
  });

  public goToCurrentStreakView(): void {
    this.widgetView.set(IncidentView.CURRENT_STREAK);
  }

  public goToPastStreaksView(): void {
    this.widgetView.set(IncidentView.PAST_STREAKS);
  }

  public getNumberOfDaysFromStreak(streakStartDate: string, streakEndDate: string): number {
    return differenceInDays(Date.parse(streakEndDate), Date.parse(streakStartDate));
  }
}
