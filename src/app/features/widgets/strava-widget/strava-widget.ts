import { DecimalPipe, NgOptimizedImage } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { ChartConfiguration, ChartData, ChartTypeRegistry } from "chart.js";
import { format, isAfter } from "date-fns";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { fr } from "date-fns/locale";
import { catchError, finalize, firstValueFrom, map, of } from "rxjs";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { ActivitiesStatsByMonth, Activity, Athlete, TokenData } from "./strava";
import { StravaActivities } from "./strava-activities/strava-activities";
import { StravaWidgetService } from "./strava-widget-service";
import { BaseChartDirective } from "ng2-charts";
import { Widget } from "@widgets/widget/widget";

@Component({
  selector: "dash-strava-widget",
  templateUrl: "./strava-widget.html",
  styleUrl: "./strava-widget.scss",
  imports: [
    NgOptimizedImage,
    Widget,
    BaseChartDirective,
    MatIcon,
    MatTooltip,
    StravaActivities,
    MatButton,
    DecimalPipe
  ]
})
export class StravaWidget implements OnInit {
  private readonly STRAVA_CLIENT_ID = 30391;
  private readonly STRAVA_ATHLETE_URL = "https://www.strava.com/athletes/";
  private readonly STORAGE_STRAVA_TOKEN_KEY = "strava_token";
  private readonly STORAGE_STRAVA_REFRESH_TOKEN_KEY = "strava_refresh_token";
  private readonly STORAGE_TOKEN_EXPIRATION_DATE_KEY = "strava_token_expires_at";

  /** Most recent activities first. */
  private byMostRecentActivity(activityA: Activity, activityB: Activity): number {
    return Date.parse(activityB.startDate) - Date.parse(activityA.startDate);
  }

  /** Oldest activities first. */
  private byOldestActivity(activityA: Activity, activityB: Activity): number {
    return Date.parse(activityA.startDate) - Date.parse(activityB.startDate);
  }

  /** Distance of an activity in kilometers, rounded to the millimeter. */
  private toKilometers(distanceInMeters: number): number {
    return Math.round(distanceInMeters * 1000) / 1000000;
  }

  protected readonly labels = {
    athleteProfile: "Athlete profile",
    strava: "Strava",
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

  protected readonly athlete = signal<Athlete | undefined>(undefined);
  protected readonly pageNumber = signal(1);
  protected readonly paginationActivities = 25;

  /** Page of activities of the logged in athlete, reloaded when the athlete or the page changes. */
  private readonly activitiesResource = rxResource({
    params: () => {
      const token = this.athlete() && this.getTokenValue();
      return token && this.isUserLoggedIn() ? { token, pageNumber: this.pageNumber() } : undefined;
    },
    stream: ({ params: { token, pageNumber } }) =>
      this.stravaWidgetService.getActivities(token, pageNumber, this.paginationActivities).pipe(
        map((activities) =>
          activities.toSorted((activityA, activityB) =>
            this.byMostRecentActivity(activityA, activityB)
          )
        ),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_ACTIVITIES);
          return of([]);
        })
      ),
    defaultValue: [] as Activity[]
  });

  protected readonly activities = this.activitiesResource.value;
  protected readonly activitiesChartData = computed<
    ChartData<keyof ChartTypeRegistry, number[], string>
  >(() => {
    const activitiesStats = this.getStatsFromActivities();
    return {
      labels: activitiesStats.map((stat) => format(stat.x, "MMM yyyy", { locale: fr })),
      datasets: [
        {
          label: "Distance (km)",
          data: activitiesStats.map((stat) => stat.y),
          backgroundColor: "rgb(252 76 2 / 70%)"
        },
        // Displayed on its own axis, as there are far fewer activities than kilometers
        {
          label: "Activités",
          type: "line",
          yAxisID: "activities",
          data: Object.values(this.getActivitiesByMonth()).map((distances) => distances.length),
          borderColor: "#2563eb",
          backgroundColor: "#2563eb",
          tension: 0.3
        }
      ]
    };
  });

  /** Totals of the displayed activities, distance in kilometers and elevation in meters. */
  protected readonly activitiesSummary = computed(() =>
    this.activities().reduce(
      (summary, activity) => ({
        count: summary.count + 1,
        distance: summary.distance + activity.distance / 1000,
        elevation: summary.elevation + activity.totalElevationGain
      }),
      { count: 0, distance: 0, elevation: 0 }
    )
  );

  protected readonly chartOptions: ChartConfiguration["options"] = {
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

  protected readonly isWidgetLoaded = computed(
    () => this.isAthleteLoaded() && !this.activitiesResource.isLoading()
  );

  private readonly isAthleteLoaded = signal(true);

  // Strava redirects to the current page, encoded so that its query parameters are kept
  private readonly loginToStravaUrl = `https://www.strava.com/oauth/authorize?client_id=${this.STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(location.href)}&response_type=code&scope=read,activity:read`;

  private readonly ERROR_GETTING_TOKEN = "Erreur lors de la connexion à Strava.";
  private readonly ERROR_NO_REFRESH_TOKEN = "Vous n'êtes pas connecté à Strava.";
  private readonly ERROR_GETTING_ATHLETE_DATA =
    "Erreur lors de la récupération de vos informations Strava.";
  private readonly ERROR_GETTING_ACTIVITIES =
    "Erreur lors de la récupération des activités Strava.";

  private readonly stravaWidgetService = inject(StravaWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  public ngOnInit(): void {
    // The athlete is loaded by the first refresh of the widget, only the code sent back by
    // Strava after the login is handled here
    const initTimeout = setTimeout(async () => {
      const apiCode = this.route.snapshot.queryParamMap.get("code");
      if (apiCode) {
        await this.getToken(apiCode);
      }
    }, 1000);
    this.destroyRef.onDestroy(() => clearTimeout(initTimeout));
  }

  protected refreshWidget(): void {
    this.getUserData();
  }

  private getUserData(): void {
    if (this.isUserLoggedIn()) {
      this.getAthleteData();
    } else if (this.getRefreshTokenValue()) {
      this.refreshTokenFromApi();
    }
  }

  private async getToken(apiCode: string): Promise<void> {
    this.isAthleteLoaded.set(false);
    try {
      const response: TokenData = await firstValueFrom(this.stravaWidgetService.getToken(apiCode));
      this.storeTokenData(response);
      this.getAthleteData();
      await this.router.navigate(["/"]);
    } catch (error) {
      this.isAthleteLoaded.set(true);
      this.errorHandlerService.handleError(error as HttpErrorResponse, this.ERROR_GETTING_TOKEN);
    }
  }

  private getActivitiesByMonth(): Record<string, number[]> {
    return this.activities()
      .toSorted((activityA, activityB) => this.byOldestActivity(activityA, activityB))
      .reduce((activitiesByMonth: Record<string, number[]>, activity) => {
        const month = format(new Date(activity.startDateLocal), "yyyy-MM");
        (activitiesByMonth[month] ??= []).push(this.toKilometers(activity.distance));
        return activitiesByMonth;
      }, {});
  }

  private getStatsFromActivities(): ActivitiesStatsByMonth[] {
    return Object.entries(this.getActivitiesByMonth()).map(([month, distances]) => ({
      x: new Date(month),
      y: Math.round(distances.reduce((total, distance) => total + distance, 0))
    }));
  }

  protected isUserLoggedIn(): boolean {
    const token = this.getTokenValue();
    const refreshToken = this.getRefreshTokenValue();
    const tokenExpirationDate = this.getTokenExpiresAtValue();
    return (
      token !== null &&
      refreshToken !== null &&
      tokenExpirationDate !== null &&
      isAfter(new Date(Number.parseInt(tokenExpirationDate) * 1000), new Date())
    );
  }

  protected loginToStrava(): void {
    window.open(this.loginToStravaUrl, "_self");
  }

  protected getNextActivitiesPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((pageNumber) => pageNumber - 1);
    }
  }

  protected getPreviousActivitiesPage(): void {
    if (this.activities().length === this.paginationActivities) {
      this.pageNumber.update((pageNumber) => pageNumber + 1);
    }
  }

  protected getAthleteProfileUrl(athleteId: number): string {
    return `${this.STRAVA_ATHLETE_URL}${athleteId}`;
  }

  private getAthleteData(): void {
    const token = this.getTokenValue();
    if (token) {
      this.isAthleteLoaded.set(false);
      this.stravaWidgetService
        .getAthleteData(token)
        .pipe(finalize(() => this.isAthleteLoaded.set(true)))
        .subscribe({
          next: (response) => this.athlete.set(response),
          error: (error: HttpErrorResponse) =>
            this.errorHandlerService.handleError(error, this.ERROR_GETTING_ATHLETE_DATA)
        });
    }
  }

  private storeTokenData(tokenData: TokenData): void {
    localStorage.setItem(this.STORAGE_STRAVA_TOKEN_KEY, tokenData.accessToken);
    localStorage.setItem(this.STORAGE_STRAVA_REFRESH_TOKEN_KEY, tokenData.refreshToken);
    localStorage.setItem(this.STORAGE_TOKEN_EXPIRATION_DATE_KEY, tokenData.expiresAt);
  }

  private getTokenValue(): string | null {
    return localStorage.getItem(this.STORAGE_STRAVA_TOKEN_KEY);
  }

  private getRefreshTokenValue(): string | null {
    return localStorage.getItem(this.STORAGE_STRAVA_REFRESH_TOKEN_KEY);
  }

  private getTokenExpiresAtValue(): string | null {
    return localStorage.getItem(this.STORAGE_TOKEN_EXPIRATION_DATE_KEY);
  }

  private refreshTokenFromApi(): void {
    const refreshToken = this.getRefreshTokenValue();
    if (refreshToken) {
      this.isAthleteLoaded.set(false);
      this.stravaWidgetService
        .getRefreshToken(refreshToken)
        .pipe(finalize(() => this.isAthleteLoaded.set(true)))
        .subscribe({
          next: (response: TokenData) => {
            this.storeTokenData(response);
            this.athlete.set(response.athlete);
          },
          error: (error: HttpErrorResponse) =>
            this.errorHandlerService.handleError(error, this.ERROR_NO_REFRESH_TOKEN)
        });
    }
  }
}
