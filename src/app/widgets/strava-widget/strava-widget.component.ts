import { DecimalPipe } from "@angular/common";
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
import { catchError, firstValueFrom, map, of } from "rxjs";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { IActivitiesStatsByMonth, IActivity, IAthlete, ITokenData } from "./IStrava";
import { StravaActivitiesComponent } from "./strava-activities/strava-activities.component";
import { StravaWidgetService } from "./strava.widget.service";
import { BaseChartDirective } from "ng2-charts";
import { WidgetComponent } from "../widget/widget.component";

@Component({
  selector: "dash-strava-widget",
  templateUrl: "./strava-widget.component.html",
  styleUrl: "./strava-widget.component.scss",
  imports: [
    WidgetComponent,
    BaseChartDirective,
    MatIcon,
    MatTooltip,
    StravaActivitiesComponent,
    MatButton,
    DecimalPipe
  ]
})
export class StravaWidgetComponent implements OnInit {
  public readonly athlete = signal<IAthlete | undefined>(undefined);
  public readonly pageNumber = signal(1);
  public readonly paginationActivities = 25;

  /** Page of activities of the logged in athlete, reloaded when the athlete or the page changes. */
  public readonly activitiesResource = rxResource({
    params: () => {
      const token = this.athlete() && this.getTokenValue();
      return token && this.isUserLoggedIn() ? { token, pageNumber: this.pageNumber() } : undefined;
    },
    stream: ({ params: { token, pageNumber } }) =>
      this.stravaWidgetService.getActivities(token, pageNumber, this.paginationActivities).pipe(
        map((activities) => activities.toSorted(this.sortByActivityDate)),
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_ACTIVITIES);
          return of([]);
        })
      ),
    defaultValue: [] as IActivity[]
  });

  public readonly activities = this.activitiesResource.value;
  public readonly activitiesChartData = computed<
    ChartData<keyof ChartTypeRegistry, number[], string>
  >(() => {
    const activitiesStats = this.getStatsFromActivities();
    return {
      labels: activitiesStats.map((stat) => format(stat.x, "MMM yyyy", { locale: fr })),
      datasets: [
        {
          label: "Distance (kms)",
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
  public readonly activitiesSummary = computed(() =>
    this.activities().reduce(
      (summary, activity) => ({
        count: summary.count + 1,
        distance: summary.distance + activity.distance / 1000,
        elevation: summary.elevation + activity.totalElevationGain
      }),
      { count: 0, distance: 0, elevation: 0 }
    )
  );

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

  public readonly isWidgetLoaded = computed(
    () => this.isAthleteLoaded() && !this.activitiesResource.isLoading()
  );

  private readonly isAthleteLoaded = signal(true);

  private readonly STRAVA_CLIENT_ID = 30391;
  private readonly loginToStravaUrl = `https://www.strava.com/oauth/authorize?client_id=${this.STRAVA_CLIENT_ID}&redirect_uri=${location.href}/&response_type=code&scope=read,activity:read`;
  private readonly STRAVA_ATHLETE_URL = "https://www.strava.com/athletes/";

  private readonly STORAGE_STRAVA_TOKEN_KEY = "strava_token";
  private readonly STORAGE_STRAVA_REFRESH_TOKEN_KEY = "strava_refresh_token";
  private readonly STORAGE_TOKEN_EXPIRATION_DATE_KEY = "strava_token_expires_at";

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
    const initTimeout = setTimeout(async () => {
      this.getAthleteData();
      const apiCode = this.route.snapshot.queryParamMap.get("code");
      if (apiCode) {
        await this.getToken(apiCode);
      }
    }, 1000);
    this.destroyRef.onDestroy(() => clearTimeout(initTimeout));
  }

  public refreshWidget(): void {
    this.getUserData();
  }

  public getUserData(): void {
    if (this.isUserLoggedIn()) {
      this.getAthleteData();
    } else if (this.getRefreshTokenValue()) {
      this.refreshTokenFromApi();
    }
  }

  public async getToken(apiCode: string): Promise<void> {
    this.isAthleteLoaded.set(false);
    try {
      const response: ITokenData = await firstValueFrom(this.stravaWidgetService.getToken(apiCode));
      this.storeTokenData(response);
      await this.refreshPage();
    } catch (error) {
      this.errorHandlerService.handleError(error as HttpErrorResponse, this.ERROR_GETTING_TOKEN);
    }
  }

  public getActivitiesByMonth(): Record<string, number[]> {
    return this.activities()
      .toSorted((activityA, activityB) => this.sortByActivityDate(activityA, activityB, false))
      .reduce((activitiesByMonth: Record<string, number[]>, activity) => {
        const month = format(new Date(activity.startDateLocal), "yyyy-MM");
        const distance = Math.round(activity.distance * 1000) / 1000000;
        activitiesByMonth[month] = [...(activitiesByMonth[month] ?? []), distance];
        return activitiesByMonth;
      }, {});
  }

  public getStatsFromActivities(): IActivitiesStatsByMonth[] {
    return Object.entries(this.getActivitiesByMonth()).map(([month, distances]) => ({
      x: new Date(month),
      y: Math.round(distances.reduce((total, distance) => total + distance, 0))
    }));
  }

  public isUserLoggedIn(): boolean {
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

  public loginToStrava(): void {
    window.open(this.loginToStravaUrl, "_self");
  }

  public getNextActivitiesPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((pageNumber) => pageNumber - 1);
    }
  }

  public getPreviousActivitiesPage(): void {
    if (this.activities().length === this.paginationActivities) {
      this.pageNumber.update((pageNumber) => pageNumber + 1);
    }
  }

  public getAthleteProfileUrl(athleteId: number): string {
    return `${this.STRAVA_ATHLETE_URL}${athleteId}`;
  }

  private getAthleteData(): void {
    const token = this.getTokenValue();
    if (token) {
      this.isAthleteLoaded.set(false);
      this.stravaWidgetService.getAthleteData(token).subscribe({
        next: (response) => this.athlete.set(response),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_ATHLETE_DATA),
        complete: () => this.isAthleteLoaded.set(true)
      });
    }
  }

  private async refreshPage(): Promise<void> {
    await this.router.navigate(["/"]);
  }

  private sortByActivityDate(
    activityA: IActivity,
    activityB: IActivity,
    sortByDateDesc = true
  ): number {
    const startDateA = Date.parse(activityA.startDate);
    const startDateB = Date.parse(activityB.startDate);
    if (startDateA === startDateB) {
      return 0;
    } else if (sortByDateDesc) {
      return startDateA < startDateB ? 1 : -1;
    } else {
      return startDateA > startDateB ? 1 : -1;
    }
  }

  private storeTokenData(tokenData: ITokenData): void {
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
      this.stravaWidgetService.getRefreshToken(refreshToken).subscribe({
        next: (response: ITokenData) => {
          this.storeTokenData(response);
          this.athlete.set(response.athlete);
          this.isAthleteLoaded.set(true);
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_NO_REFRESH_TOKEN)
      });
    }
  }
}
