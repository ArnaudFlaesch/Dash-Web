import { WIDGET_ID } from "@widgets/widget-tokens";
import { provideHttpClient } from "@angular/common/http";
import { addDays } from "date-fns";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { Activity, Athlete, TokenData } from "./strava";
import { StravaWidget } from "./strava-widget";
import { StravaWidgetService } from "./strava-widget-service";
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from "@angular/router";
import { BaseChartDirective } from "ng2-charts";
import { NEVER } from "rxjs";
import { vi } from "vitest";

const STRAVA_TOKEN_KEY = "strava_token";
const STRAVA_REFRESH_TOKEN_KEY = "strava_refresh_token";
const STRAVA_TOKEN_EXPIRATION_DATE_KEY = "strava_token_expires_at";

const STRAVA_TOKEN = "FAKE_TOKEN";
const STRAVA_REFRESH_TOKEN = "FAKE_REFRESH_TOKEN";

const athleteUrl = (token: string): string =>
  `${environment.backend_url}/stravaWidget/getAthleteData?token=${token}`;
const activitiesUrl = (pageNumber: number, token = STRAVA_TOKEN): string =>
  `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${token}&pageNumber=${pageNumber}&numberOfActivities=25`;
const getTokenUrl = `${environment.backend_url}/stravaWidget/getToken`;
const getRefreshTokenUrl = `${environment.backend_url}/stravaWidget/getRefreshToken`;

/** Expiration date of a valid token, in seconds as sent by Strava. */
function inFourDays(): string {
  return Math.floor(addDays(new Date(), 4).getTime() / 1000).toString();
}

function clearStoredToken(): void {
  window.localStorage.removeItem(STRAVA_TOKEN_KEY);
  window.localStorage.removeItem(STRAVA_REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY);
}

function storeToken(expiresAt = inFourDays()): void {
  window.localStorage.setItem(STRAVA_TOKEN_KEY, STRAVA_TOKEN);
  window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);
  window.localStorage.setItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY, expiresAt);
}

/** Lets the resources receive the flushed responses, then load the requests depending on them. */
async function flushResources(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
}

function spyOnHandleError(): ReturnType<typeof vi.spyOn> {
  return vi
    .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
    .mockImplementation(() => undefined);
}

const athlete = {
  id: 25345795,
  username: "aflaesch",
  resourceState: 2,
  firstname: "Arnaud",
  lastname: "Flaesch",
  city: "Paris",
  state: "",
  country: "France",
  sex: "M",
  profileMedium: "https://strava.example/medium.jpg",
  profile: "https://strava.example/large.jpg"
} as Athlete;

function createActivity(activity: Partial<Activity>): Activity {
  return {
    id: 1,
    name: "Evening Run",
    type: "Run",
    distance: 10704.7,
    movingTime: 2958,
    totalElevationGain: 49.2,
    averageSpeed: 3.619,
    maxSpeed: 16.919,
    startDate: "2022-10-20T16:34:39Z",
    startDateLocal: "2022-10-20T18:34:39Z",
    ...activity
  } as Activity;
}

/** Full page of activities, of 10 km and 20 m of elevation each. */
const activities = Array.from({ length: 25 }, (_, index) =>
  createActivity({
    id: index + 1,
    name: `Run ${index + 1}`,
    distance: 10000,
    movingTime: 3000,
    totalElevationGain: 20
  })
);

const tokenResponse = {
  expiresAt: inFourDays(),
  refreshToken: "NEW_REFRESH_TOKEN",
  accessToken: "NEW_TOKEN",
  athlete
} as TokenData;

describe("StravaWidget", () => {
  let fixture: ComponentFixture<StravaWidget>;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: 1 }
      ]
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    clearStoredToken();
  });

  afterEach(() => {
    httpTestingController.verify();
    clearStoredToken();
  });

  /** Creates the widget, which loads the athlete on its first refresh. */
  function createWidget(): void {
    fixture = TestBed.createComponent(StravaWidget);
    element = fixture.nativeElement as HTMLElement;
    TestBed.tick();
  }

  /** Displays the widget of a logged in athlete, with the given activities. */
  async function createLoggedInWidget(athleteActivities: Activity[]): Promise<void> {
    storeToken();
    createWidget();
    httpTestingController.expectOne(athleteUrl(STRAVA_TOKEN)).flush(athlete);
    await flushResources();
    httpTestingController.expectOne(activitiesUrl(1)).flush(athleteActivities);
    await flushResources();
    await fixture.whenStable();
  }

  function findButton(text: string): HTMLButtonElement {
    return Array.from(element.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(text)
    ) as HTMLButtonElement;
  }

  function getPageNumber(): string | undefined {
    return element.querySelector(".strava-page-number")?.textContent?.trim();
  }

  function getChartData(): BaseChartDirective["data"] {
    return fixture.debugElement
      .query(By.directive(BaseChartDirective))
      .injector.get(BaseChartDirective).data;
  }

  function isLoading(): boolean {
    return element.querySelector("mat-spinner") !== null;
  }

  /** Requests for the athlete, whatever the token. */
  function athleteRequests(): ReturnType<HttpTestingController["match"]> {
    return httpTestingController.match((request) =>
      request.url.startsWith(`${environment.backend_url}/stravaWidget/getAthleteData`)
    );
  }

  it("should display the login to Strava without sending any request when the user is not logged in", async () => {
    createWidget();
    await fixture.whenStable();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    httpTestingController.expectNone(() => true);
    expect(isLoading()).toBe(false);
    expect(element.querySelector(".widget-header")?.textContent).toContain("Strava");
    expect(element.querySelector("#strava-profile-picture")).toBeNull();
    expect(element.querySelector(".strava-login")?.textContent).toContain(
      "Connectez votre compte Strava pour suivre vos activités."
    );
    const loginButton = element.querySelector("#login-to-strava-button") as HTMLButtonElement;
    expect(loginButton.textContent).toContain("Se connecter à Strava");

    loginButton.click();
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://www.strava.com/oauth/authorize"),
      "_self"
    );
  });

  it("should open the Strava login page, redirecting to the current page", async () => {
    const initialUrl = location.href;
    // Query parameters of the current page, which must not be mixed with the ones of Strava
    history.replaceState(null, "", "/home?tabId=3&view=list");
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    try {
      const pageUrl = location.href;
      createWidget();
      await fixture.whenStable();
      (element.querySelector("#login-to-strava-button") as HTMLButtonElement).click();

      expect(openSpy).toHaveBeenCalledWith(expect.any(String), "_self");
      const loginUrl = new URL(openSpy.mock.calls[0][0] as string);
      expect(loginUrl.origin + loginUrl.pathname).toEqual("https://www.strava.com/oauth/authorize");
      expect(loginUrl.searchParams.get("client_id")).toEqual("30391");
      expect(loginUrl.searchParams.get("redirect_uri")).toEqual(pageUrl);
      expect(loginUrl.searchParams.get("response_type")).toEqual("code");
      expect(loginUrl.searchParams.get("scope")).toEqual("read,activity:read");
      expect(loginUrl.searchParams.has("view")).toBe(false);
    } finally {
      history.replaceState(null, "", initialUrl);
    }
  });

  it("should request the athlete only once when the user is logged in", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await createLoggedInWidget([]);

      await vi.advanceTimersByTimeAsync(1000);
      expect(athleteRequests()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should display a spinner until the athlete and the activities are loaded", async () => {
    storeToken();
    createWidget();
    expect(isLoading()).toBe(true);

    httpTestingController.expectOne(athleteUrl(STRAVA_TOKEN)).flush(athlete);
    await flushResources();
    // Still loading the activities
    expect(isLoading()).toBe(true);
    httpTestingController.expectOne(activitiesUrl(1)).flush([]);
    await flushResources();
    await fixture.whenStable();
    expect(isLoading()).toBe(false);
  });

  it("should display the athlete and the summary of the activities", async () => {
    await createLoggedInWidget(activities);

    expect(element.querySelector("#strava-widget-header")?.getAttribute("href")).toEqual(
      `https://www.strava.com/athletes/${athlete.id}`
    );
    const profilePicture = element.querySelector("#strava-profile-picture") as HTMLImageElement;
    expect(profilePicture.src).toEqual(athlete.profileMedium);
    expect(profilePicture.alt).toEqual("Athlete profile");
    expect(element.querySelector(".strava-header")?.textContent).toContain("Arnaud Flaesch");
    expect(element.querySelector(".strava-login")).toBeNull();

    const summaryItems = element.querySelectorAll(".strava-summary-item");
    expect(summaryItems).toHaveLength(3);
    expect(summaryItems[0].textContent).toContain("25");
    expect(summaryItems[0].textContent).toContain("Activités");
    expect(summaryItems[1].textContent).toContain("250 km");
    expect(summaryItems[1].textContent).toContain("Distance");
    expect(summaryItems[2].textContent).toContain("500 m");
    expect(summaryItems[2].textContent).toContain("Dénivelé");
    expect(element.querySelector("#strava-statistics canvas")).not.toBeNull();
    expect(element.querySelectorAll("#strava-activities-container .strava-activity")).toHaveLength(
      25
    );
  });

  it("should sum the distance and the elevation of the activities", async () => {
    await createLoggedInWidget(Array.from({ length: 25 }, (_, id) => createActivity({ id })));

    const summaryItems = element.querySelectorAll(".strava-summary-item");
    // 25 activities of 10.7047 km and 49.2 m
    expect(summaryItems[0].textContent).toContain("25");
    expect(summaryItems[1].textContent).toContain("268 km");
    expect(summaryItems[2].textContent).toContain("1,230 m");

    const chartData = getChartData();
    expect(chartData?.labels).toEqual(["oct. 2022"]);
    const [distanceDataset, activitiesDataset] = chartData?.datasets ?? [];
    expect(distanceDataset.label).toEqual("Distance (km)");
    expect(distanceDataset.data).toEqual([268]);
    expect(activitiesDataset.label).toEqual("Activités");
    expect(activitiesDataset.data).toEqual([25]);
  });

  it("should display the activities from the most recent, and their statistics by month", async () => {
    await createLoggedInWidget([
      createActivity({
        id: 1,
        name: "October run",
        distance: 10704.7,
        startDate: "2022-10-09T09:44:01Z",
        startDateLocal: "2022-10-09T11:44:01Z"
      }),
      createActivity({
        id: 2,
        name: "September run",
        distance: 5000.4,
        startDate: "2022-09-22T15:31:15Z",
        startDateLocal: "2022-09-22T17:31:15Z"
      }),
      createActivity({
        id: 3,
        name: "Last October run",
        distance: 12397.6,
        startDate: "2022-10-20T16:34:39Z",
        startDateLocal: "2022-10-20T18:34:39Z"
      })
    ]);

    const names = Array.from(element.querySelectorAll(".activity-name")).map((name) =>
      name.textContent?.trim()
    );
    expect(names).toEqual(["Last October run", "October run", "September run"]);

    // Oldest month first, distances rounded to the kilometer
    const chartData = getChartData();
    expect(chartData?.labels).toEqual(["sept. 2022", "oct. 2022"]);
    const [distanceDataset, activitiesDataset] = chartData?.datasets ?? [];
    expect(distanceDataset.data).toEqual([5, 23]);
    expect(activitiesDataset.data).toEqual([1, 2]);
  });

  it("should navigate between the pages of activities", async () => {
    await createLoggedInWidget(activities);
    const moreRecentButton = findButton("Plus récentes");
    const olderButton = element.querySelector(".older-activities-button") as HTMLButtonElement;
    expect(getPageNumber()).toEqual("Page 1");
    expect(moreRecentButton.disabled).toBe(true);
    expect(olderButton.disabled).toBe(false);
    expect(olderButton.textContent).toContain("Plus anciennes");

    olderButton.click();
    TestBed.tick();
    httpTestingController.expectOne(activitiesUrl(2)).flush(activities.slice(0, 3));
    await flushResources();
    await fixture.whenStable();

    expect(getPageNumber()).toEqual("Page 2");
    const pageTwoMoreRecentButton = findButton("Plus récentes");
    expect(pageTwoMoreRecentButton.disabled).toBe(false);
    // Last page, as it is not full
    expect((element.querySelector(".older-activities-button") as HTMLButtonElement).disabled).toBe(
      true
    );
    expect(element.querySelectorAll(".strava-activity")).toHaveLength(3);

    pageTwoMoreRecentButton.click();
    TestBed.tick();
    httpTestingController.expectOne(activitiesUrl(1)).flush(activities);
    await flushResources();
    await fixture.whenStable();
    expect(getPageNumber()).toEqual("Page 1");
    expect(element.querySelectorAll(".strava-activity")).toHaveLength(25);
  });

  it("should not go before the first page nor after the last one", async () => {
    // More activities than a page: not the expected page, so not followed by another one
    await createLoggedInWidget([...activities, createActivity({ id: 26 })]);

    const olderButton = element.querySelector(".older-activities-button") as HTMLButtonElement;
    expect(olderButton.disabled).toBe(false);
    olderButton.click();
    findButton("Plus récentes").dispatchEvent(new MouseEvent("click"));
    TestBed.tick();
    await fixture.whenStable();

    httpTestingController.expectNone(() => true);
    expect(getPageNumber()).toEqual("Page 1");
  });

  it("should display a message without activities", async () => {
    await createLoggedInWidget([]);

    expect(element.querySelector(".strava-empty")?.textContent).toContain(
      "Aucune activité pour le moment."
    );
    expect(element.querySelector("#activities-pagination-container")).toBeNull();
    expect(element.querySelector(".strava-login")).toBeNull();
  });

  it("should get a new token with the refresh token, then load the activities", async () => {
    window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);
    createWidget();

    const refreshTokenRequest = httpTestingController.expectOne(getRefreshTokenUrl);
    expect(refreshTokenRequest.request.body).toEqual({ refreshToken: STRAVA_REFRESH_TOKEN });
    refreshTokenRequest.flush(tokenResponse);
    expect(window.localStorage.getItem(STRAVA_TOKEN_KEY)).toEqual(tokenResponse.accessToken);
    expect(window.localStorage.getItem(STRAVA_REFRESH_TOKEN_KEY)).toEqual(
      tokenResponse.refreshToken
    );
    expect(window.localStorage.getItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY)).toEqual(
      tokenResponse.expiresAt
    );

    // The activities of the athlete are then loaded with the new token
    TestBed.tick();
    httpTestingController
      .expectOne(activitiesUrl(1, tokenResponse.accessToken))
      .flush([createActivity({})]);
    await flushResources();
    await fixture.whenStable();

    expect(element.querySelector(".strava-header")?.textContent).toContain("Arnaud Flaesch");
    expect(element.querySelector(".strava-login")).toBeNull();
    expect(element.querySelectorAll(".strava-activity")).toHaveLength(1);
  });

  it("should not request the athlete with an expired token, only refresh the token", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      storeToken("1");
      createWidget();

      httpTestingController.expectOne(getRefreshTokenUrl).flush(tokenResponse);
      await flushResources();
      httpTestingController.expectOne(activitiesUrl(1, tokenResponse.accessToken)).flush([]);
      await flushResources();

      await vi.advanceTimersByTimeAsync(1000);
      expect(athleteRequests()).toHaveLength(0);
      await fixture.whenStable();
      expect(element.querySelector(".strava-header")?.textContent).toContain("Arnaud Flaesch");
    } finally {
      vi.useRealTimers();
    }
  });

  it("should display the login when the expired token cannot be refreshed", async () => {
    spyOnHandleError();
    storeToken("1");
    createWidget();

    httpTestingController
      .expectOne(getRefreshTokenUrl)
      .flush(null, { status: 401, statusText: "Unauthorized" });
    await fixture.whenStable();

    expect(element.querySelector(".strava-login")).not.toBeNull();
  });

  it("should stop loading when refreshing the token fails", async () => {
    const handleErrorSpy = spyOnHandleError();
    window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);

    createWidget();
    expect(isLoading()).toBe(true);
    const refreshTokenRequest = httpTestingController.expectOne(getRefreshTokenUrl);
    expect(refreshTokenRequest.request.body).toEqual({ refreshToken: STRAVA_REFRESH_TOKEN });
    refreshTokenRequest.flush(null, { status: 401, statusText: "Unauthorized" });
    await fixture.whenStable();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401 }),
      "Vous n'êtes pas connecté à Strava."
    );
    expect(isLoading()).toBe(false);
    expect(element.querySelector(".strava-login")).not.toBeNull();
  });

  it("should stop loading when getting the athlete fails", async () => {
    const handleErrorSpy = spyOnHandleError();
    storeToken();

    createWidget();
    expect(isLoading()).toBe(true);
    httpTestingController
      .expectOne(athleteUrl(STRAVA_TOKEN))
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await flushResources();
    await fixture.whenStable();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération de vos informations Strava."
    );
    // No athlete, so no activity is loaded
    expect(element.querySelector(".widget-header")?.textContent).toContain("Strava");
    expect(element.querySelector("#strava-profile-picture")).toBeNull();
    expect(isLoading()).toBe(false);
    expect(element.querySelector(".strava-empty")).not.toBeNull();
  });

  it("should handle the error when getting the activities", async () => {
    const handleErrorSpy = spyOnHandleError();
    storeToken();
    createWidget();
    httpTestingController.expectOne(athleteUrl(STRAVA_TOKEN)).flush(athlete);
    await flushResources();

    httpTestingController
      .expectOne(activitiesUrl(1))
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await flushResources();
    await fixture.whenStable();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des activités Strava."
    );
    expect(isLoading()).toBe(false);
    expect(element.querySelector(".strava-empty")).not.toBeNull();
    expect(element.querySelector("#activities-pagination-container")).toBeNull();
  });
});

describe("StravaWidget login callback", () => {
  let fixture: ComponentFixture<StravaWidget>;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: 1 },
        // Strava sends back the code as a query parameter of the page
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ code: "API_CODE" }) } }
        }
      ]
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    clearStoredToken();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    httpTestingController.verify();
    clearStoredToken();
  });

  function createWidget(): void {
    fixture = TestBed.createComponent(StravaWidget);
    element = fixture.nativeElement as HTMLElement;
    TestBed.tick();
  }

  /** Waits for the code to be handled, a second after the widget initialization. */
  async function waitForCodeHandling(): Promise<void> {
    await vi.advanceTimersByTimeAsync(1000);
    vi.useRealTimers();
    TestBed.tick();
  }

  function isLoading(): boolean {
    return element.querySelector("mat-spinner") !== null;
  }

  it("should get the token with the code received after the login to Strava", async () => {
    createWidget();
    // The component exchanges the code for a token through the service
    const getTokenSpy = vi
      .spyOn(TestBed.inject(StravaWidgetService), "getToken")
      .mockReturnValue(NEVER);
    TestBed.tick();
    expect(getTokenSpy).not.toHaveBeenCalled();

    await waitForCodeHandling();
    expect(getTokenSpy).toHaveBeenCalledWith("API_CODE");
  });

  it("should not get the token once the widget is destroyed", async () => {
    createWidget();
    const getTokenSpy = vi
      .spyOn(TestBed.inject(StravaWidgetService), "getToken")
      .mockReturnValue(NEVER);
    TestBed.tick();
    fixture.destroy();

    await waitForCodeHandling();
    expect(getTokenSpy).not.toHaveBeenCalled();
  });

  it("should store the token received with the code, then load the athlete", async () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
    createWidget();
    await waitForCodeHandling();

    expect(isLoading()).toBe(true);
    const getTokenRequest = httpTestingController.expectOne(getTokenUrl);
    expect(getTokenRequest.request.body).toEqual({ apiCode: "API_CODE" });
    getTokenRequest.flush(tokenResponse);
    await flushResources();

    expect(window.localStorage.getItem(STRAVA_TOKEN_KEY)).toEqual(tokenResponse.accessToken);
    expect(window.localStorage.getItem(STRAVA_REFRESH_TOKEN_KEY)).toEqual(
      tokenResponse.refreshToken
    );
    expect(window.localStorage.getItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY)).toEqual(
      tokenResponse.expiresAt
    );
    // The code is removed from the URL
    expect(navigateSpy).toHaveBeenCalledWith(["/"]);

    httpTestingController.expectOne(athleteUrl(tokenResponse.accessToken)).flush(athlete);
    await flushResources();
    httpTestingController.expectOne(activitiesUrl(1, tokenResponse.accessToken)).flush([]);
    await flushResources();
    await fixture.whenStable();

    expect(isLoading()).toBe(false);
    expect(element.querySelector(".strava-header")?.textContent).toContain("Arnaud Flaesch");
  });

  it("should stop loading when getting the token fails", async () => {
    const handleErrorSpy = spyOnHandleError();
    createWidget();
    await waitForCodeHandling();

    expect(isLoading()).toBe(true);
    httpTestingController
      .expectOne(getTokenUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await flushResources();
    await fixture.whenStable();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la connexion à Strava."
    );
    expect(window.localStorage.getItem(STRAVA_TOKEN_KEY)).toBeNull();
    expect(isLoading()).toBe(false);
    expect(element.querySelector(".strava-login")).not.toBeNull();
  });
});
