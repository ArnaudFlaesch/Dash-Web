import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ChartData, ChartTypeRegistry } from "chart.js";
import { format, isAfter } from "date-fns";

import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { fr } from "date-fns/locale";
import { firstValueFrom } from "rxjs";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { IActivitiesStatsByMonth, IActivity, IAthlete, ITokenData } from "./IStrava";
import { StravaActivitiesComponent } from "./strava-activities/strava-activities.component";
import { StravaWidgetService } from "./strava.widget.service";

import { BaseChartDirective } from "ng2-charts";
import { WidgetComponent } from "../widget/widget.component";

@Component({
  selector: "dash-strava-widget",
  templateUrl: "./strava-widget.component.html",
  styleUrls: ["./strava-widget.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WidgetComponent,
    BaseChartDirective,
    MatIcon,
    MatIconButton,
    MatTooltip,
    StravaActivitiesComponent,
    MatButton
  ]
})
export class StravaWidgetComponent implements OnInit {
  public activities: WritableSignal<IActivity[]> = signal([]);
  public athlete: IAthlete | undefined;
  public activitiesChartData: ChartData<keyof ChartTypeRegistry, number[], string> | undefined =
    undefined;

  public isWidgetLoaded = signal(true);
  public pageNumber = 1;
  public readonly paginationActivities = 25;

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

  public async ngOnInit(): Promise<void> {
    setTimeout(async () => {
      this.getAthleteData();
      const apiCode = this.route.snapshot.queryParamMap.get("code");
      if (apiCode) {
        await this.getToken(apiCode);
      }
    }, 1000);
  }

  public refreshWidget(): void {
    this.getUserData();
  }

  public getUserData(): void {
    if (this.isUserLoggedIn()) {
      this.activities.set([]);
      this.getAthleteData();
    } else if (this.getRefreshTokenValue()) {
      this.refreshTokenFromApi();
    }
  }

  public async getToken(apiCode: string): Promise<void> {
    this.isWidgetLoaded.set(false);
    try {
      const response: ITokenData = await firstValueFrom(this.stravaWidgetService.getToken(apiCode));
      window.localStorage.setItem(this.STORAGE_STRAVA_TOKEN_KEY, response.accessToken);
      window.localStorage.setItem(this.STORAGE_STRAVA_REFRESH_TOKEN_KEY, response.refreshToken);
      window.localStorage.setItem(this.STORAGE_TOKEN_EXPIRATION_DATE_KEY, response.expiresAt);
      await this.refreshPage();
    } catch (error) {
      this.errorHandlerService.handleError(error as HttpErrorResponse, this.ERROR_GETTING_TOKEN);
    }
  }

  public getActivitiesByMonth(): Record<string, number[]> {
    return [...this.activities()]
      .sort((activityA, activityB) => this.sortByActivityDate(activityA, activityB, false))
      .reduce((activitiesByMonth: Record<string, number[]>, activity: IActivity) => {
        const month = format(new Date(activity.startDateLocal), "yyyy-MM");
        if (!activitiesByMonth[month]) {
          activitiesByMonth[month] = [];
        }
        activitiesByMonth[month].push(Math.round(activity.distance * 1000) / 1000000);
        return activitiesByMonth;
      }, {});
  }

  public getStatsFromActivities(): IActivitiesStatsByMonth[] {
    const activitiesByMonthList = this.getActivitiesByMonth();
    return Object.keys(activitiesByMonthList).map((month) => {
      return {
        x: new Date(month),
        y: Math.round(
          activitiesByMonthList[month].reduce(
            (total: number, distance: number) => total + distance,
            0
          )
        )
      };
    });
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
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.getActivities();
    }
  }

  public getPreviousActivitiesPage(): void {
    if (this.activities().length === this.paginationActivities) {
      this.pageNumber++;
      this.getActivities();
    }
  }

  public getAthleteProfileUrl(athleteId: number): string {
    return `${this.STRAVA_ATHLETE_URL}${athleteId}`;
  }

  private getAthleteData(): void {
    const token = this.getTokenValue();
    if (token) {
      this.isWidgetLoaded.set(false);
      this.stravaWidgetService.getAthleteData(token).subscribe({
        next: (response) => {
          this.athlete = response;
          this.getActivities();
          this.isWidgetLoaded.set(true);
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_ATHLETE_DATA),
        complete: () => this.isWidgetLoaded.set(true)
      });
    }
  }

  private getChartData(): void {
    const activitiesStats = this.getStatsFromActivities();
    this.activitiesChartData = {
      labels: activitiesStats.map((data: IActivitiesStatsByMonth) =>
        format(data.x, "MMM yyyy", { locale: fr })
      ),
      datasets: [
        {
          label: "Distance (kms)",
          data: activitiesStats.map((act) => act.y)
        },
        {
          label: "Activités",
          data: Object.keys(this.getActivitiesByMonth()).map(
            (month) => this.getActivitiesByMonth()[month].length
          )
        }
      ]
    };
  }

  private async refreshPage(): Promise<void> {
    await this.router.navigate(["/"]);
  }

  private getActivities(): void {
    const token = this.getTokenValue();
    if (token && this.isUserLoggedIn()) {
      this.isWidgetLoaded.set(false);
      this.stravaWidgetService
        .getActivities(token, this.pageNumber, this.paginationActivities)
        .subscribe({
          next: (response) => {
            this.activities.set([...response].sort(this.sortByActivityDate));
            this.getChartData();
            this.isWidgetLoaded.set(true);
          },
          error: (error: HttpErrorResponse) =>
            this.errorHandlerService.handleError(error, this.ERROR_GETTING_ACTIVITIES),
          complete: () => this.isWidgetLoaded.set(true)
        });
    }
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

  private getTokenValue(): string | null {
    return window.localStorage.getItem(this.STORAGE_STRAVA_TOKEN_KEY);
  }

  private getRefreshTokenValue(): string | null {
    return window.localStorage.getItem(this.STORAGE_STRAVA_REFRESH_TOKEN_KEY);
  }

  private getTokenExpiresAtValue(): string | null {
    return window.localStorage.getItem(this.STORAGE_TOKEN_EXPIRATION_DATE_KEY);
  }

  private refreshTokenFromApi(): void {
    const refreshToken = this.getRefreshTokenValue();
    if (refreshToken) {
      this.isWidgetLoaded.set(false);
      this.stravaWidgetService.getRefreshToken(refreshToken).subscribe({
        next: (response: ITokenData) => {
          window.localStorage.setItem(this.STORAGE_STRAVA_TOKEN_KEY, response.accessToken);
          window.localStorage.setItem(this.STORAGE_STRAVA_REFRESH_TOKEN_KEY, response.refreshToken);
          window.localStorage.setItem(this.STORAGE_TOKEN_EXPIRATION_DATE_KEY, response.expiresAt);
          this.athlete = response.athlete;
          this.isWidgetLoaded.set(true);
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_NO_REFRESH_TOKEN)
      });
    }
  }
}
