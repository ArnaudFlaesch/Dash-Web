import { WIDGET_ID } from "@widgets/widget.tokens";
import { provideHttpClient } from "@angular/common/http";
import { addDays, getTime } from "date-fns";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { IActivity, IAthlete, ITokenData } from "./strava.model";
import { StravaWidget } from "./strava-widget";
import { Home } from "@features/home/home";
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from "@angular/router";
import { vi } from "vitest";

describe("StravaWidget", () => {
  let component: StravaWidget;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: "home",
            component: Home
          }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: 1 }
      ]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(StravaWidget, "")
      .compileComponents();

    const fixture = TestBed.createComponent(StravaWidget);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);

    window.localStorage.removeItem(STRAVA_TOKEN_KEY);
    window.localStorage.removeItem(STRAVA_REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  const STRAVA_TOKEN = "FAKE_TOKEN";
  const STRAVA_REFRESH_TOKEN = "FAKE_REFRESH_TOKEN";
  const TOKEN_EXPIRATION_DATE = getTime(addDays(new Date(), 4)).toString();

  const STRAVA_TOKEN_KEY = "strava_token";
  const STRAVA_REFRESH_TOKEN_KEY = "strava_refresh_token";
  const STRAVA_TOKEN_EXPIRATION_DATE_KEY = "strava_token_expires_at";

  vi.setSystemTime(new Date(1644882400)); // 15/02/2022

  const athleteData = {
    id: 25345795,
    username: "aflaesch",
    resourceState: 2,
    firstname: "Arnaud",
    lastname: "Flaesch",
    city: "Paris",
    state: "",
    country: "France",
    sex: "M",
    profileMedium:
      "https://dgalywyr863hv.cloudfront.net/pictures/athletes/25345795/20393158/1/medium.jpg",
    profile: "https://dgalywyr863hv.cloudfront.net/pictures/athletes/25345795/20393158/1/large.jpg"
  } as IAthlete;

  const activitiesData: IActivity[] = Array(25).fill({
    resourceState: 2,
    athlete: { id: 25345795, resourceState: 0 },
    name: "Evening Run",
    distance: 10704.7,
    movingTime: 2958,
    elapsedTime: 3118,
    totalElevationGain: 49.2,
    type: "Run",
    workoutType: 0,
    id: 7.993416249e9,
    externalId: "ad38998a-3d06-41ee-9e9d-b6bb7c143edf-activity.fit",
    uploadId: 8.550990828e9,
    startDate: "2022-10-20T16:34:39Z",
    startDateLocal: "2022-10-20T18:34:39Z",
    timezone: "(GMT+01:00) Europe/Paris",
    utcOffset: 7200.0,
    startLatlng: [48, 2],
    endLatlng: [48, 2],
    locationCity: undefined,
    locationState: undefined,
    locationCountry: "France",
    startLatitude: 0,
    startLongitude: 0,
    achievementCount: 1,
    kudosCount: 2,
    commentCount: 0,
    athleteCount: 1,
    photoCount: 0,
    map: { id: "a7993416249", summaryPolyline: "", resourceState: 0 },
    trainer: false,
    commute: false,
    manual: false,
    private: false,
    visibility: "everyone",
    flagged: false,
    gearId: "g11571174",
    fromAcceptedTag: false,
    uploadIdStr: 8.550990828e9,
    averageSpeed: 3.619,
    maxSpeed: 16.919,
    hasHeartrate: false,
    heartrateOptOut: false,
    displayHideHeartrateOption: false,
    elevHigh: 57.0,
    elevLow: 34.6,
    prCount: 0,
    totalPhotoCount: 0,
    hasKudoed: false
  });

  it("Should display the interface to log in", () => {
    expect(component.isUserLoggedIn()).toBe(false);
  });

  it("should create a widget with a token and a refresh token", async () => {
    window.localStorage.setItem(STRAVA_TOKEN_KEY, STRAVA_TOKEN);
    window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);
    window.localStorage.setItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY, TOKEN_EXPIRATION_DATE);
    expect(component.isUserLoggedIn()).toBe(true);
    expect(component.isWidgetLoaded()).toEqual(true);
    expect(component.activities()).toEqual([]);
    component.refreshWidget();
    TestBed.tick();
    const getAthleteDataRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteData?token=${STRAVA_TOKEN}`
    );
    getAthleteDataRequest.flush(athleteData);
    await flushResources();

    const getActivitiesRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&pageNumber=1&numberOfActivities=25`
    );
    getActivitiesRequest.flush(activitiesData);
    await flushResources();

    expect(component.isWidgetLoaded()).toEqual(true);
    expect(component.activities()).toHaveLength(25);
    expect(component.getActivitiesByMonth()).toEqual({
      "2022-10": [
        10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047,
        10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047,
        10.7047, 10.7047, 10.7047, 10.7047, 10.7047
      ]
    });
    const statsFromActivities = component.getStatsFromActivities();
    expect(statsFromActivities[0].y).toEqual(268);
    const [distanceDataset, activitiesDataset] = component.activitiesChartData().datasets;
    expect(distanceDataset.data).toEqual([268]);
    expect(activitiesDataset.data).toEqual([25]);
    expect(component.activitiesSummary().count).toEqual(25);
    expect(component.activitiesSummary().distance).toBeCloseTo(267.6175);
    expect(component.activitiesSummary().elevation).toBeCloseTo(1230);

    component.getPreviousActivitiesPage();
    TestBed.tick();

    const getNextActivitiesRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&pageNumber=2&numberOfActivities=25`
    );
    getNextActivitiesRequest.flush([]);
    await flushResources();
    expect(component.pageNumber()).toEqual(2);

    component.getNextActivitiesPage();
    TestBed.tick();
    const getPreviousActivitiesRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&pageNumber=1&numberOfActivities=25`
    );
    getPreviousActivitiesRequest.flush([]);
    await flushResources();
    expect(component.pageNumber()).toEqual(1);
  });

  it("Should display athlete url", () => {
    expect(component.getAthleteProfileUrl(athleteData.id)).toEqual(
      "https://www.strava.com/athletes/" + athleteData.id
    );
  });

  it("Should get refresh token", async () => {
    window.localStorage.removeItem(STRAVA_TOKEN_KEY);
    window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);
    component.getUserData();
    const response = {
      token_type: "Bearer",
      expiresAt: "1644882561",
      expiresIn: 10384,
      refreshToken: "REFRESH_TOKEN",
      accessToken: "TOKEN",
      athlete: {
        id: 25345795,
        username: "af",
        resource_state: 2,
        firstname: "A",
        lastname: "F"
      }
    } as unknown as ITokenData;

    const getRefreshTokenDataRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getRefreshToken`
    );
    getRefreshTokenDataRequest.flush(response);
    expect(component.isUserLoggedIn()).toEqual(true);

    // The activities of the athlete are then loaded with the new token
    TestBed.tick();
    httpTestingController
      .expectOne(
        `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${response.accessToken}&pageNumber=1&numberOfActivities=25`
      )
      .flush([]);
    await flushResources();
  });

  const tokenResponse = {
    expiresAt: "1644882561",
    refreshToken: "NEW_REFRESH_TOKEN",
    accessToken: "NEW_TOKEN",
    athlete: athleteData
  } as ITokenData;

  function storeValidToken(): void {
    window.localStorage.setItem(STRAVA_TOKEN_KEY, STRAVA_TOKEN);
    window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);
    window.localStorage.setItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY, TOKEN_EXPIRATION_DATE);
  }

  function spyOnHandleError(): ReturnType<typeof vi.spyOn> {
    return vi
      .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
      .mockImplementation(() => undefined);
  }

  it("Should not be logged in with an expired token", () => {
    window.localStorage.setItem(STRAVA_TOKEN_KEY, STRAVA_TOKEN);
    window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);
    window.localStorage.setItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY, "1");
    expect(component.isUserLoggedIn()).toBe(false);
  });

  it("Should not send any request without token", () => {
    component.refreshWidget();
    TestBed.tick();
    httpTestingController.expectNone(() => true);
    expect(component.athlete()).toBeUndefined();
  });

  it("Should open the Strava login page, redirecting to the current page", () => {
    const initialUrl = location.href;
    // Query parameters of the current page, which must not be mixed with the ones of Strava
    history.replaceState(null, "", "/home?tabId=3&view=list");
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    try {
      const pageUrl = location.href;
      TestBed.createComponent(StravaWidget).componentInstance.loginToStrava();

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

  it("Should store the token received with the code, then load the athlete", async () => {
    const navigateSpy = vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);

    const tokenPromise = component.getToken("API_CODE");
    expect(component.isWidgetLoaded()).toBe(false);
    const getTokenRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getToken`
    );
    expect(getTokenRequest.request.body).toEqual({ apiCode: "API_CODE" });
    getTokenRequest.flush(tokenResponse);
    await tokenPromise;

    expect(window.localStorage.getItem(STRAVA_TOKEN_KEY)).toEqual(tokenResponse.accessToken);
    expect(window.localStorage.getItem(STRAVA_REFRESH_TOKEN_KEY)).toEqual(
      tokenResponse.refreshToken
    );
    expect(window.localStorage.getItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY)).toEqual(
      tokenResponse.expiresAt
    );
    // The code is removed from the URL
    expect(navigateSpy).toHaveBeenCalledWith(["/"]);

    httpTestingController
      .expectOne(
        `${environment.backend_url}/stravaWidget/getAthleteData?token=${tokenResponse.accessToken}`
      )
      .flush(athleteData);
    await flushResources();
    expect(component.athlete()).toEqual(athleteData);
    httpTestingController
      .expectOne(
        `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${tokenResponse.accessToken}&pageNumber=1&numberOfActivities=25`
      )
      .flush([]);
    await flushResources();
    expect(component.isWidgetLoaded()).toBe(true);
  });

  it("Should stop loading when getting the token fails", async () => {
    const handleErrorSpy = spyOnHandleError();

    const tokenPromise = component.getToken("API_CODE");
    httpTestingController
      .expectOne(`${environment.backend_url}/stravaWidget/getToken`)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await tokenPromise;

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la connexion à Strava."
    );
    expect(window.localStorage.getItem(STRAVA_TOKEN_KEY)).toBeNull();
    expect(component.isWidgetLoaded()).toBe(true);
  });

  it("Should stop loading when getting the athlete fails", () => {
    const handleErrorSpy = spyOnHandleError();
    storeValidToken();

    component.refreshWidget();
    expect(component.isWidgetLoaded()).toBe(false);
    httpTestingController
      .expectOne(`${environment.backend_url}/stravaWidget/getAthleteData?token=${STRAVA_TOKEN}`)
      .flush(null, { status: 500, statusText: "Internal Server Error" });

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération de vos informations Strava."
    );
    expect(component.athlete()).toBeUndefined();
    expect(component.isWidgetLoaded()).toBe(true);
  });

  it("Should stop loading when refreshing the token fails", () => {
    const handleErrorSpy = spyOnHandleError();
    window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);

    component.refreshWidget();
    expect(component.isWidgetLoaded()).toBe(false);
    const refreshTokenRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getRefreshToken`
    );
    expect(refreshTokenRequest.request.body).toEqual({ refreshToken: STRAVA_REFRESH_TOKEN });
    refreshTokenRequest.flush(null, { status: 401, statusText: "Unauthorized" });

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401 }),
      "Vous n'êtes pas connecté à Strava."
    );
    expect(component.isUserLoggedIn()).toBe(false);
    expect(component.isWidgetLoaded()).toBe(true);
  });

  it("Should handle the error when getting the activities, and not change page", async () => {
    const handleErrorSpy = spyOnHandleError();
    storeValidToken();
    component.refreshWidget();
    httpTestingController
      .expectOne(`${environment.backend_url}/stravaWidget/getAthleteData?token=${STRAVA_TOKEN}`)
      .flush(athleteData);
    await flushResources();

    httpTestingController
      .expectOne(
        `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&pageNumber=1&numberOfActivities=25`
      )
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await flushResources();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des activités Strava."
    );
    expect(component.activities()).toEqual([]);
    expect(component.isWidgetLoaded()).toBe(true);

    // No more recent page than the first one, and no older page without a full page
    component.getNextActivitiesPage();
    component.getPreviousActivitiesPage();
    TestBed.tick();
    expect(component.pageNumber()).toEqual(1);
  });
});

describe("StravaWidget initialization", () => {
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: 1 },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ code: "API_CODE" }) } }
        }
      ]
    })
      .overrideTemplate(StravaWidget, "")
      .compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    window.localStorage.removeItem("strava_token");
    window.localStorage.removeItem("strava_refresh_token");
    window.localStorage.removeItem("strava_token_expires_at");
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.useRealTimers();
  });

  it("Should get the token with the code received after the login to Strava", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const fixture = TestBed.createComponent(StravaWidget);
    const getTokenSpy = vi.spyOn(fixture.componentInstance, "getToken").mockResolvedValue();
    TestBed.tick();
    expect(getTokenSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(getTokenSpy).toHaveBeenCalledWith("API_CODE");
  });

  it("Should not get the token once the widget is destroyed", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const fixture = TestBed.createComponent(StravaWidget);
    const getTokenSpy = vi.spyOn(fixture.componentInstance, "getToken").mockResolvedValue();
    TestBed.tick();
    fixture.destroy();

    await vi.advanceTimersByTimeAsync(1000);
    expect(getTokenSpy).not.toHaveBeenCalled();
  });
});

describe("StravaWidget rendering", () => {
  const token = "FAKE_TOKEN";
  const athleteUrl = `${environment.backend_url}/stravaWidget/getAthleteData?token=${token}`;
  const activitiesUrl = (pageNumber: number): string =>
    `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${token}&pageNumber=${pageNumber}&numberOfActivities=25`;
  const athlete = {
    id: 25345795,
    firstname: "Arnaud",
    lastname: "Flaesch",
    profileMedium: "https://strava.example/medium.jpg"
  } as IAthlete;
  const activities = Array.from(
    { length: 25 },
    (_, index) =>
      ({
        id: index + 1,
        name: `Run ${index + 1}`,
        type: "Run",
        distance: 10000,
        movingTime: 3000,
        totalElevationGain: 20,
        averageSpeed: 3,
        maxSpeed: 5,
        startDate: "2022-10-20T16:34:39Z",
        startDateLocal: "2022-10-20T18:34:39Z"
      }) as IActivity
  );

  let fixture: ComponentFixture<StravaWidget>;
  let component: StravaWidget;
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
    window.localStorage.removeItem("strava_token");
    window.localStorage.removeItem("strava_refresh_token");
    window.localStorage.removeItem("strava_token_expires_at");
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  function createWidget(): void {
    fixture = TestBed.createComponent(StravaWidget);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    TestBed.tick();
  }

  /** Displays the widget of a logged in athlete, with the given activities. */
  async function createLoggedInWidget(athleteActivities: IActivity[]): Promise<void> {
    window.localStorage.setItem("strava_token", token);
    window.localStorage.setItem("strava_refresh_token", "FAKE_REFRESH_TOKEN");
    window.localStorage.setItem(
      "strava_token_expires_at",
      Math.floor(addDays(new Date(), 4).getTime() / 1000).toString()
    );
    createWidget();
    httpTestingController.expectOne(athleteUrl).flush(athlete);
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

  /** Requests for the athlete, whatever the token. */
  function athleteRequests(): ReturnType<HttpTestingController["match"]> {
    return httpTestingController.match((request) =>
      request.url.startsWith(`${environment.backend_url}/stravaWidget/getAthleteData`)
    );
  }

  it("should request the athlete only once when the user is logged in", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await createLoggedInWidget([]);

    await vi.advanceTimersByTimeAsync(1000);
    expect(athleteRequests()).toHaveLength(0);
    vi.useRealTimers();
  });

  it("should not request the athlete with an expired token, only refresh the token", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.localStorage.setItem("strava_token", token);
    window.localStorage.setItem("strava_refresh_token", "FAKE_REFRESH_TOKEN");
    window.localStorage.setItem("strava_token_expires_at", "1");
    createWidget();

    const newToken = "NEW_TOKEN";
    httpTestingController
      .expectOne(`${environment.backend_url}/stravaWidget/getRefreshToken`)
      .flush({
        accessToken: newToken,
        refreshToken: "NEW_REFRESH_TOKEN",
        expiresAt: Math.floor(addDays(new Date(), 4).getTime() / 1000).toString(),
        athlete
      });
    await flushResources();
    httpTestingController
      .expectOne(
        `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${newToken}&pageNumber=1&numberOfActivities=25`
      )
      .flush([]);
    await flushResources();

    await vi.advanceTimersByTimeAsync(1000);
    expect(athleteRequests()).toHaveLength(0);
    expect(component.athlete()).toEqual(athlete);
    vi.useRealTimers();
  });

  it("should display the login to Strava when the user is not logged in", async () => {
    createWidget();
    await fixture.whenStable();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    expect(element.querySelector(".widget-header")?.textContent).toContain(component.labels.strava);
    expect(element.querySelector("#strava-profile-picture")).toBeNull();
    expect(element.querySelector(".strava-login")?.textContent).toContain(
      component.labels.connectStravaAccount
    );
    const loginButton = element.querySelector("#login-to-strava-button") as HTMLButtonElement;
    expect(loginButton.textContent).toContain(component.labels.loginToStrava);

    loginButton.click();
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://www.strava.com/oauth/authorize"),
      "_self"
    );
  });

  it("should display a spinner until the athlete is loaded", async () => {
    window.localStorage.setItem("strava_token", token);
    window.localStorage.setItem("strava_refresh_token", "FAKE_REFRESH_TOKEN");
    window.localStorage.setItem(
      "strava_token_expires_at",
      Math.floor(addDays(new Date(), 4).getTime() / 1000).toString()
    );
    createWidget();
    expect(element.querySelector("mat-spinner")).not.toBeNull();

    httpTestingController.expectOne(athleteUrl).flush(athlete);
    await flushResources();
    // Still loading the activities
    expect(element.querySelector("mat-spinner")).not.toBeNull();
    httpTestingController.expectOne(activitiesUrl(1)).flush([]);
    await flushResources();
    await fixture.whenStable();
    expect(element.querySelector("mat-spinner")).toBeNull();
  });

  it("should display the athlete and the summary of the activities", async () => {
    await createLoggedInWidget(activities);

    expect(element.querySelector("#strava-widget-header")?.getAttribute("href")).toEqual(
      `https://www.strava.com/athletes/${athlete.id}`
    );
    const profilePicture = element.querySelector("#strava-profile-picture") as HTMLImageElement;
    expect(profilePicture.src).toEqual(athlete.profileMedium);
    expect(profilePicture.alt).toEqual(component.labels.athleteProfile);
    expect(element.querySelector(".strava-header")?.textContent).toContain("Arnaud Flaesch");

    const summaryItems = element.querySelectorAll(".strava-summary-item");
    expect(summaryItems).toHaveLength(3);
    expect(summaryItems[0].textContent).toContain("25");
    expect(summaryItems[0].textContent).toContain(component.labels.activities);
    expect(summaryItems[1].textContent).toContain(`250 ${component.labels.kilometers}`);
    expect(summaryItems[1].textContent).toContain(component.labels.distance);
    expect(summaryItems[2].textContent).toContain(`500 ${component.labels.meters}`);
    expect(summaryItems[2].textContent).toContain(component.labels.elevation);
    expect(element.querySelector("#strava-statistics canvas")).not.toBeNull();
    expect(element.querySelectorAll("#strava-activities-container .strava-activity")).toHaveLength(
      25
    );
  });

  it("should navigate between the pages of activities", async () => {
    await createLoggedInWidget(activities);
    const moreRecentButton = findButton(component.labels.moreRecent);
    const olderButton = element.querySelector(".older-activities-button") as HTMLButtonElement;
    expect(element.querySelector(".strava-page-number")?.textContent).toContain(
      `${component.labels.page} 1`
    );
    expect(moreRecentButton.disabled).toBe(true);
    expect(olderButton.disabled).toBe(false);
    expect(olderButton.textContent).toContain(component.labels.older);

    olderButton.click();
    TestBed.tick();
    httpTestingController.expectOne(activitiesUrl(2)).flush(activities.slice(0, 3));
    await flushResources();
    await fixture.whenStable();

    expect(element.querySelector(".strava-page-number")?.textContent).toContain(
      `${component.labels.page} 2`
    );
    const pageTwoMoreRecentButton = findButton(component.labels.moreRecent);
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
    expect(component.pageNumber()).toEqual(1);
    expect(element.querySelectorAll(".strava-activity")).toHaveLength(25);
  });

  it("should display a message without activities", async () => {
    await createLoggedInWidget([]);

    expect(element.querySelector(".strava-empty")?.textContent).toContain(
      component.labels.noActivity
    );
    expect(element.querySelector("#activities-pagination-container")).toBeNull();
    expect(element.querySelector(".strava-login")).toBeNull();
  });
});
