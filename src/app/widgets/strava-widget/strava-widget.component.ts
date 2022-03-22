import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { format, isAfter } from 'date-fns';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { StravaWidgetService } from './strava.widget.service';
import { IActivity, IAthlete } from './IStrava';

@Component({
  selector: 'app-strava-widget',
  templateUrl: './strava-widget.component.html',
  styleUrls: ['./strava-widget.component.scss']
})
export class StravaWidgetComponent {
  public activities: IActivity[] = [];
  public athlete: IAthlete | undefined;
  public token: string | null = null;
  public refreshToken: string | null = null;
  public tokenExpirationDate: string | null = null;

  private STRAVA_CLIENT_ID = 30391;

  public loginToStravaUrl = `https://www.strava.com/oauth/authorize?client_id=${this.STRAVA_CLIENT_ID}&redirect_uri=${location.href}/&response_type=code&scope=read,activity:read`;

  private STORAGE_STRAVA_TOKEN_KEY = 'strava_token';
  private STORAGE_STRAVA_REFRESH_TOKEN_KEY = 'strava_refresh_token';
  private STORAGE_TOKEN_EXPIRATION_DATE_KEY = 'strava_token_expires_at';

  private ERROR_GETTING_TOKEN = 'Erreur lors de la connexion à Strava.';
  private ERROR_NO_REFRESH_TOKEN = "Vous n'êtes pas connecté à Strava.";
  private ERROR_GETTING_ATHLETE_DATA = 'Erreur lors de la récupération de vos informations.';
  private ERROR_GETTING_ACTIVITIES = 'Erreur lors de la récupération des activités.';

  private paginationActivities = 20;

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
    this.token = window.localStorage.getItem(this.STORAGE_STRAVA_TOKEN_KEY);
    this.refreshToken = window.localStorage.getItem(this.STORAGE_STRAVA_REFRESH_TOKEN_KEY);
    this.tokenExpirationDate = window.localStorage.getItem(this.STORAGE_TOKEN_EXPIRATION_DATE_KEY);
  }

  public refreshWidget() {
    if (this.token) {
      this.activities = [];
      this.getAthleteData();
    } else {
      this.refreshTokenFromApi();
    }
  }

  public getToken(apiCode: string) {
    this.stravaWidgetService.getToken(apiCode).subscribe({
      next: (response: any) => {
        window.localStorage.setItem(this.STORAGE_STRAVA_TOKEN_KEY, response.access_token);
        window.localStorage.setItem(this.STORAGE_STRAVA_REFRESH_TOKEN_KEY, response.refresh_token);
        window.localStorage.setItem(this.STORAGE_TOKEN_EXPIRATION_DATE_KEY, response.expires_at);
        this.router.navigate(['/']);
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_TOKEN)
    });
  }

  private refreshTokenFromApi() {
    if (this.refreshToken) {
      this.stravaWidgetService.getRefreshToken(this.refreshToken).subscribe({
        next: (response: any) => {
          this.token = response.access_token;
          this.refreshToken = response.refresh_token;
          this.tokenExpirationDate = response.expires_at;
          this.athlete = response.athlete;
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_NO_REFRESH_TOKEN)
      });
    } else {
      console.error('No refresh token');
    }
  }

  public getAthleteData() {
    if (this.token) {
      this.stravaWidgetService.getAthleteData(this.token).subscribe({
        next: (response) => {
          this.athlete = response;
          this.getActivities();
        },
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_ATHLETE_DATA)
      });
    }
  }

  public getActivities() {
    if (
      this.token &&
      this.tokenExpirationDate &&
      isAfter(new Date(Number.parseInt(this.tokenExpirationDate) * 1000), new Date())
    ) {
      this.stravaWidgetService.getActivities(this.token, this.paginationActivities).subscribe({
        next: (response) => (this.activities = [...response].reverse()),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_GETTING_ACTIVITIES)
      });
    }
  }

  public getActivitiesByMonth(): Record<string, number[]> {
    return this.activities.reduce(
      (activitiesByMonth: Record<string, number[]>, activity: IActivity) => {
        const month = format(new Date(activity.start_date_local), 'yyyy-MM');
        if (!activitiesByMonth[month]) {
          activitiesByMonth[month] = [];
        }
        activitiesByMonth[month].push(Math.round(activity.distance * 1000) / 1000000);
        return activitiesByMonth;
      },
      {}
    );
  }

  public getStatsFromActivities() {
    const activitiesByMonthList = this.getActivitiesByMonth();
    return Object.keys(activitiesByMonthList).map((month) => {
      return {
        x: new Date(month),
        y: Math.round(
          activitiesByMonthList[month].reduce((total: number, distance: number) => total + distance)
        )
      };
    });
  }

  public getTitleToDisplay(activity: IActivity): string {
    return `${format(new Date(activity.start_date_local), 'dd MMM')}  ${activity.name}  ${
      Math.round(activity.distance * 1000) / 1000000
    } kms`;
  }

  public isUserLoggedIn(): boolean {
    return (
      this.token !== null &&
      this.refreshToken !== null &&
      this.tokenExpirationDate !== null &&
      isAfter(new Date(Number.parseInt(this.tokenExpirationDate) * 1000), new Date())
    );
  }

  public getChartData() {
    return {
      labels: this.getStatsFromActivities().map((data: any) => format(data.x, 'MMM yyyy')),
      datasets: [
        {
          label: 'Distance (kms)',
          data: this.getStatsFromActivities().map((act) => act.y)
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
  public getAthleteProfileUrl = (athleteId?: number) =>
    `https://www.strava.com/athletes/${athleteId}`;

  public formatDate = (date: Date) => format(new Date(date), 'dd MMM');
  public roundDistance = (distance: number) => Math.round(distance) / 1000;

  public convertDecimalTimeToTime(decimalTime: number): number {
    const decimalPart = decimalTime % 1;
    const convertedDecimalPart = Math.round(decimalPart * 6) / 10;
    return decimalTime - decimalPart + convertedDecimalPart;
  }
}
