import { NgOptimizedImage } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { isAfter } from "date-fns";
import { MatIcon } from "@angular/material/icon";
import { catchError, finalize, firstValueFrom, map, of } from "rxjs";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { Activity, Athlete, TokenData } from "./strava";
import { StravaWidgetView } from "./strava-widget-view/strava-widget-view";
import { StravaWidgetService } from "./strava-widget-service";
import { Widget } from "@widgets/widget/widget";

@Component({
  selector: "dash-strava-widget",
  templateUrl: "./strava-widget.html",
  styleUrl: "./strava-widget.scss",
  imports: [NgOptimizedImage, Widget, MatIcon, StravaWidgetView]
})
export class StravaWidget implements OnInit {
  private readonly STRAVA_CLIENT_ID = 30391;
  private readonly STRAVA_ATHLETE_URL = "https://www.strava.com/athletes/";
  private readonly STORAGE_STRAVA_TOKEN_KEY = "strava_token";
  private readonly STORAGE_STRAVA_REFRESH_TOKEN_KEY = "strava_refresh_token";
  private readonly STORAGE_TOKEN_EXPIRATION_DATE_KEY = "strava_token_expires_at";

  protected readonly labels = {
    athleteProfile: "Athlete profile",
    strava: "Strava"
  };
  private readonly ERROR_MESSAGES = {
    gettingToken: "Erreur lors de la connexion à Strava.",
    noRefreshToken: "Vous n'êtes pas connecté à Strava.",
    gettingAthleteData: "Erreur lors de la récupération de vos informations Strava.",
    gettingActivities: "Erreur lors de la récupération des activités Strava."
  };

  public readonly athlete = signal<Athlete | undefined>(undefined);
  public readonly pageNumber = signal(1);
  private readonly isAthleteLoaded = signal(true);

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
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingActivities);
          return of([]);
        })
      ),
    defaultValue: [] as Activity[]
  });

  public readonly activities = this.activitiesResource.value;

  public readonly isWidgetLoaded = computed(
    () => this.isAthleteLoaded() && !this.activitiesResource.isLoading()
  );

  public readonly paginationActivities = 25;
  // Strava redirects to the current page, encoded so that its query parameters are kept
  private readonly loginToStravaUrl = `https://www.strava.com/oauth/authorize?client_id=${this.STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(location.href)}&response_type=code&scope=read,activity:read`;

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

  /** Most recent activities first. */
  private byMostRecentActivity(activityA: Activity, activityB: Activity): number {
    return Date.parse(activityB.startDate) - Date.parse(activityA.startDate);
  }

  public refreshWidget(): void {
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
      this.errorHandlerService.handleError(
        error as HttpErrorResponse,
        this.ERROR_MESSAGES.gettingToken
      );
    }
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

  public showMoreRecentActivities(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((pageNumber) => pageNumber - 1);
    }
  }

  public showOlderActivities(): void {
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
      this.stravaWidgetService
        .getAthleteData(token)
        .pipe(finalize(() => this.isAthleteLoaded.set(true)))
        .subscribe({
          next: (response) => this.athlete.set(response),
          error: (error: HttpErrorResponse) =>
            this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingAthleteData)
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
            this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.noRefreshToken)
        });
    }
  }
}
