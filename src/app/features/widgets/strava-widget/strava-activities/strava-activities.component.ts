import { DecimalPipe } from "@angular/common";
import { Component, input } from "@angular/core";
import { format } from "date-fns";
import { IActivity } from "../strava.model";
import { fr } from "date-fns/locale/fr";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: "dash-strava-activities",
  templateUrl: "./strava-activities.component.html",
  styleUrl: "./strava-activities.component.scss",
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelContent,
    MatIcon,
    DecimalPipe
  ]
})
export class StravaActivitiesComponent {
  /** Icons of the most common types of Strava activities. */
  private readonly ACTIVITY_TYPE_ICONS: Record<string, string> = {
    Run: "directions_run",
    TrailRun: "directions_run",
    Ride: "directions_bike",
    VirtualRide: "directions_bike",
    MountainBikeRide: "directions_bike",
    Swim: "pool",
    Walk: "directions_walk",
    Hike: "hiking"
  };

  public readonly labels = {
    kilometers: "km",
    distance: "Distance",
    duration: "Durée",
    elevation: "Dénivelé",
    meters: "m",
    averageSpeed: "Vitesse moy.",
    kilometersPerHour: "km/h",
    maxSpeed: "Vitesse max",
    achievements: "Trophées",
    kudos: "Kudos",
    comments: "Commentaires",
    viewOnStrava: "Voir sur Strava"
  };

  public readonly activities = input.required<IActivity[]>();

  public formatDate(date: string): string {
    return format(new Date(date), "dd MMMM", { locale: fr });
  }

  /** Strava distances are in meters. */
  public roundDistance(distanceInMeters: number): number {
    return Math.round(distanceInMeters * 100) / 100000;
  }

  public getActivityIcon(activityType: string): string {
    return this.ACTIVITY_TYPE_ICONS[activityType] ?? "fitness_center";
  }

  /** Duration in seconds displayed as "1 h 05" or "42 min". */
  public formatDuration(durationInSeconds: number): string {
    const minutes = Math.round(durationInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    return hours ? `${hours} h ${String(minutes % 60).padStart(2, "0")}` : `${minutes} min`;
  }

  /** Strava speeds are in meters per second. */
  public toKilometersPerHour(speedInMetersPerSecond: number): number {
    return speedInMetersPerSecond * 3.6;
  }
}
