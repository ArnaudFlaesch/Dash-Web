import { provideHttpClient } from "@angular/common/http";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { addDays, getTime } from "date-fns";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { IActivity, IAthlete, ITokenData } from "./IStrava";
import { StravaWidgetComponent } from "./strava-widget.component";
import { StravaWidgetService } from "./strava.widget.service";
import { WidgetService } from "../../services/widget.service/widget.service";
import { HomeComponent } from "../../home/home.component";
import { provideRouter } from "@angular/router";

describe("StravaWidgetComponent", () => {
  let component: StravaWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [
        provideRouter([
          {
            path: "home",
            component: HomeComponent
          }
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        StravaWidgetService,
        ErrorHandlerService,
        WidgetService,
        { provide: "widgetId", useValue: 1 }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(StravaWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);

    window.localStorage.removeItem(STRAVA_TOKEN_KEY);
    window.localStorage.removeItem(STRAVA_REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  const STRAVA_TOKEN = "FAKE_TOKEN";
  const STRAVA_REFRESH_TOKEN = "FAKE_REFRESH_TOKEN";
  const TOKEN_EXPIRATION_DATE = getTime(addDays(new Date(), 4)).toString();

  const STRAVA_TOKEN_KEY = "strava_token";
  const STRAVA_REFRESH_TOKEN_KEY = "strava_refresh_token";
  const STRAVA_TOKEN_EXPIRATION_DATE_KEY = "strava_token_expires_at";

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

  it("should create a widget with a token and a refresh token", () => {
    window.localStorage.setItem(STRAVA_TOKEN_KEY, STRAVA_TOKEN);
    window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);
    window.localStorage.setItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY, TOKEN_EXPIRATION_DATE);
    expect(component.isUserLoggedIn()).toBe(true);
    expect(component.isWidgetLoaded()).toEqual(true);
    expect(component.activities()).toEqual([]);
    component.refreshWidget();
    const getAthleteDataRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteData?token=${STRAVA_TOKEN}`
    );
    getAthleteDataRequest.flush(athleteData);

    const getActivitiesRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&pageNumber=1&numberOfActivities=25`
    );
    getActivitiesRequest.flush(activitiesData);

    expect(component.isWidgetLoaded()).toEqual(true);
    expect(component.activities().length).toEqual(25);
    expect(component.getActivitiesByMonth()).toEqual({
      "2022-10": [
        10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047,
        10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047,
        10.7047, 10.7047, 10.7047, 10.7047, 10.7047
      ]
    });
    const statsFromActivities = component.getStatsFromActivities();
    expect(statsFromActivities[0].y).toEqual(268);

    component.getPreviousActivitiesPage();

    const getNextActivitiesRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&pageNumber=2&numberOfActivities=25`
    );
    getNextActivitiesRequest.flush([]);
    expect(component.pageNumber).toEqual(2);

    component.getNextActivitiesPage();
    const getPreviousActivitiesRequest = httpTestingController.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&pageNumber=1&numberOfActivities=25`
    );
    getPreviousActivitiesRequest.flush([]);
    expect(component.pageNumber).toEqual(1);
  });

  it("Should display athlete url", () => {
    expect(component.getAthleteProfileUrl(athleteData.id)).toEqual(
      "https://www.strava.com/athletes/" + athleteData.id
    );
  });

  it("Should get refresh token", () => {
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
  });
});
