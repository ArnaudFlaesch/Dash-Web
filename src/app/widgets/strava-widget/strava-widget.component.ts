import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartData, ChartTypeRegistry } from 'chart.js';
import { format, isAfter } from 'date-fns';
import { ErrorHandlerService } from '../../services/error.handler.service';
import {
  IActivitiesStatsByMonth,
  IActivity,
  IAthlete,
  ITokenData
} from './IStrava';
import { StravaWidgetService } from './strava.widget.service';

@Component({
  selector: 'app-strava-widget',
  templateUrl: './strava-widget.component.html',
  styleUrls: ['./strava-widget.component.scss']
})
export class StravaWidgetComponent {
  public activities: IActivity[] = [];
  public athlete: IAthlete | undefined;
  public activitiesChartData:
    | ChartData<keyof ChartTypeRegistry, number[], string>
    | undefined = undefined;

  private STRAVA_CLIENT_ID = 30391;

  public loginToStravaUrl = `https://www.strava.com/oauth/authorize?client_id=${this.STRAVA_CLIENT_ID}&redirect_uri=${location.href}/&response_type=code&scope=read,activity:read`;
  private STRAVA_ATHLETE_URL = 'https://www.strava.com/athletes/';

  private STORAGE_STRAVA_TOKEN_KEY = 'strava_token';
  private STORAGE_STRAVA_REFRESH_TOKEN_KEY = 'strava_refresh_token';
  private STORAGE_TOKEN_EXPIRATION_DATE_KEY = 'strava_token_expires_at';

  private ERROR_GETTING_TOKEN = 'Erreur lors de la connexion à Strava.';
  private ERROR_NO_REFRESH_TOKEN = "Vous n'êtes pas connecté à Strava.";
  private ERROR_GETTING_ATHLETE_DATA =
    'Erreur lors de la récupération de vos informations Strava.';
  private ERROR_GETTING_ACTIVITIES =
    'Erreur lors de la récupération des activités Strava.';

  private paginationActivities = 20;

  public isWidgetLoaded = true;

  constructor(
    private stravaWidgetService: StravaWidgetService,
    public sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private errorHandlerService: ErrorHandlerService,
    private router: Router
  ) {
    const apiCode = this.route.snapshot.queryParamMap.get('code');
    if (apiCode) {
      this.getToken(apiCode);
    }
  }

  public refreshWidget() {
    if (this.getTokenValue()) {
      this.getUserData();
    }
  }

  public getUserData() {
    if (this.isUserLoggedIn()) {
      if (this.getTokenValue()) {
        this.activities = [];
        this.getAthleteData();
      } else {
        this.refreshTokenFromApi();
      }
    }
  }

  public getToken(apiCode: string) {
    this.isWidgetLoaded = false;
    this.stravaWidgetService.getToken(apiCode).subscribe({
      next: (response: ITokenData) => {
        window.localStorage.setItem(
          this.STORAGE_STRAVA_TOKEN_KEY,
          response.accessToken
        );
        window.localStorage.setItem(
          this.STORAGE_STRAVA_REFRESH_TOKEN_KEY,
          response.refreshToken
        );
        window.localStorage.setItem(
          this.STORAGE_TOKEN_EXPIRATION_DATE_KEY,
          response.expiresAt
        );
        this.router.navigate(['/']);
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(
          error.message,
          this.ERROR_GETTING_TOKEN
        )
    });
  }

  private refreshTokenFromApi() {
    const refreshToken = this.getRefreshTokenValue();
    if (refreshToken) {
      this.isWidgetLoaded = false;
      this.stravaWidgetService.getRefreshToken(refreshToken).subscribe({
        next: (response: ITokenData) => {
          window.localStorage.setItem(
            this.STORAGE_STRAVA_TOKEN_KEY,
            response.accessToken
          );
          window.localStorage.setItem(
            this.STORAGE_STRAVA_REFRESH_TOKEN_KEY,
            response.refreshToken
          );
          window.localStorage.setItem(
            this.STORAGE_TOKEN_EXPIRATION_DATE_KEY,
            response.expiresAt
          );
          this.athlete = response.athlete;
          this.isWidgetLoaded = true;
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_NO_REFRESH_TOKEN
          )
      });
    } else {
      console.error('No refresh token');
    }
  }

  public getAthleteData() {
    const token = this.getTokenValue();
    if (token) {
      this.isWidgetLoaded = false;
      this.stravaWidgetService.getAthleteData(token).subscribe({
        next: (response) => {
          this.athlete = response;
          this.getActivities();
          this.isWidgetLoaded = true;
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_GETTING_ATHLETE_DATA
          )
      });
    }
  }

  public getActivities() {
    const token = this.getTokenValue();
    if (token && this.isUserLoggedIn()) {
      this.isWidgetLoaded = false;
      this.stravaWidgetService
        .getActivities(token, this.paginationActivities)
        .subscribe({
          next: (response) => {
            this.activities = [...response].reverse();
            this.getChartData();
            this.isWidgetLoaded = true;
          },
          error: (error: HttpErrorResponse) =>
            this.errorHandlerService.handleError(
              error.message,
              this.ERROR_GETTING_ACTIVITIES
            )
        });
    }
  }

  public getActivitiesByMonth(): Record<string, number[]> {
    return this.activities.reduce(
      (activitiesByMonth: Record<string, number[]>, activity: IActivity) => {
        const month = format(new Date(activity.startDateLocal), 'yyyy-MM');
        if (!activitiesByMonth[month]) {
          activitiesByMonth[month] = [];
        }
        activitiesByMonth[month].push(
          Math.round(activity.distance * 1000) / 1000000
        );
        return activitiesByMonth;
      },
      {}
    );
  }

  public getStatsFromActivities(): IActivitiesStatsByMonth[] {
    const activitiesByMonthList = this.getActivitiesByMonth();
    return Object.keys(activitiesByMonthList).map((month) => {
      return {
        x: new Date(month),
        y: Math.round(
          activitiesByMonthList[month].reduce(
            (total: number, distance: number) => total + distance
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

  public getChartData(): void {
    const activitiesStats = this.getStatsFromActivities();
    this.activitiesChartData = {
      labels: activitiesStats.map((data: IActivitiesStatsByMonth) =>
        format(data.x, 'MMM yyyy')
      ),
      datasets: [
        {
          label: 'Distance (kms)',
          data: activitiesStats.map((act) => act.y)
        },
        {
          label: 'Activités',
          data: Object.keys(this.getActivitiesByMonth()).map(
            (month) => this.getActivitiesByMonth()[month].length
          )
        }
      ]
    };
  }

  public loginToStrava = () => window.open(this.loginToStravaUrl, '_self');
  public getAthleteProfileUrl = (athleteId: number) =>
    `${this.STRAVA_ATHLETE_URL}${athleteId}`;

  public getTokenValue(): string | null {
    return window.localStorage.getItem(this.STORAGE_STRAVA_TOKEN_KEY);
  }

  public getRefreshTokenValue(): string | null {
    return window.localStorage.getItem(this.STORAGE_STRAVA_REFRESH_TOKEN_KEY);
  }

  public getTokenExpiresAtValue(): string | null {
    return window.localStorage.getItem(this.STORAGE_TOKEN_EXPIRATION_DATE_KEY);
  }
}
