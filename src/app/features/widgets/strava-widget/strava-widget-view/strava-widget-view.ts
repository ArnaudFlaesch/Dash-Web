import { DecimalPipe } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { ChartConfiguration, ChartData, ChartTypeRegistry } from "chart.js";
import { format, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { BaseChartDirective } from "ng2-charts";
import { ActivitiesOfMonth, Activity, parseStartDateLocal } from "../strava";
import { StravaActivities } from "../strava-activities/strava-activities";

@Component({
  selector: "dash-strava-widget-view",
  templateUrl: "./strava-widget-view.html",
  styleUrl: "./strava-widget-view.scss",
  imports: [BaseChartDirective, MatIcon, MatTooltip, MatButton, DecimalPipe, StravaActivities]
})
export class StravaWidgetView {
  protected readonly labels = {
    activities: "Activités",
    kilometers: "km",
    distance: "Distance",
    meters: "m",
    elevation: "Dénivelé",
    moreRecentActivities: "Activités plus récentes",
    moreRecent: "Plus récentes",
    page: "Page",
    olderActivities: "Activités plus anciennes",
    older: "Plus anciennes",
    noActivity: "Aucune activité pour le moment.",
    connectStravaAccount: "Connectez votre compte Strava pour suivre vos activités.",
    loginToStrava: "Se connecter à Strava"
  };

  public readonly isUserLoggedIn = input.required<boolean>();
  /** Page of activities, the most recent first. */
  public readonly activities = input.required<Activity[]>();
  public readonly pageNumber = input.required<number>();
  /** Number of activities of a full page. */
  public readonly paginationActivities = input.required<number>();
  public readonly loginRequested = output();
  public readonly moreRecentActivitiesRequested = output();
  public readonly olderActivitiesRequested = output();

  /** Activities grouped by the month where they took place, the oldest month first. */
  private readonly activitiesByMonth = computed<ActivitiesOfMonth[]>(() => {
    const activitiesByMonth = new Map<number, ActivitiesOfMonth>();
    for (const activity of this.activities().toSorted((activityA, activityB) =>
      this.byOldestActivity(activityA, activityB)
    )) {
      const month = startOfMonth(parseStartDateLocal(activity.startDateLocal));
      const activitiesOfMonth = activitiesByMonth.get(month.getTime()) ?? { month, activities: [] };
      activitiesOfMonth.activities.push(activity);
      activitiesByMonth.set(month.getTime(), activitiesOfMonth);
    }
    return [...activitiesByMonth.values()];
  });

  public readonly activitiesChartData = computed<
    ChartData<keyof ChartTypeRegistry, number[], string>
  >(() => {
    const activitiesByMonth = this.activitiesByMonth();
    return {
      labels: activitiesByMonth.map(({ month }) => format(month, "MMM yyyy", { locale: fr })),
      datasets: [
        {
          label: "Distance (km)",
          data: activitiesByMonth.map(({ activities }) =>
            Math.round(this.getTotalDistanceInKilometers(activities))
          ),
          backgroundColor: "rgb(252 76 2 / 70%)"
        },
        // Displayed on its own axis, as there are far fewer activities than kilometers
        {
          label: "Activités",
          type: "line",
          yAxisID: "activities",
          data: activitiesByMonth.map(({ activities }) => activities.length),
          borderColor: "#2563eb",
          backgroundColor: "#2563eb",
          tension: 0.3
        }
      ]
    };
  });

  /** Totals of the displayed activities, distance in kilometers and elevation in meters. */
  public readonly activitiesSummary = computed(() => ({
    count: this.activities().length,
    distance: this.getTotalDistanceInKilometers(this.activities()),
    elevation: this.activities().reduce(
      (elevation, activity) => elevation + activity.totalElevationGain,
      0
    )
  }));

  public readonly chartOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } } },
    elements: { bar: { borderRadius: 6 } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
      activities: { position: "right", beginAtZero: true, grid: { display: false } }
    }
  };

  /** Oldest activities first. */
  private byOldestActivity(activityA: Activity, activityB: Activity): number {
    return Date.parse(activityA.startDate) - Date.parse(activityB.startDate);
  }

  /** Strava distances are in meters. */
  private getTotalDistanceInKilometers(activities: Activity[]): number {
    return activities.reduce((distance, activity) => distance + activity.distance, 0) / 1000;
  }
}
