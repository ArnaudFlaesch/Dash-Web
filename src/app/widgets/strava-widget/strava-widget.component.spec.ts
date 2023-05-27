import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createHttpFactory,
  createRoutingFactory,
  HttpMethod,
  SpectatorHttp,
  SpectatorRouting
} from '@ngneat/spectator/jest';
import { addDays, getTime } from 'date-fns';
import { advanceTo } from 'jest-date-mock';

import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { IActivity, IAthlete, ITokenData } from './IStrava';
import { StravaWidgetComponent } from './strava-widget.component';
import { StravaWidgetService } from './strava.widget.service';

describe('StravaWidgetComponent', () => {
  let spectator: SpectatorRouting<StravaWidgetComponent>;
  let stravaWidgetService: SpectatorHttp<StravaWidgetService>;

  const STRAVA_TOKEN = 'FAKE_TOKEN';
  const STRAVA_REFRESH_TOKEN = 'FAKE_REFRESH_TOKEN';
  const TOKEN_EXPIRATION_DATE = getTime(addDays(new Date(), 4)).toString();

  const STRAVA_TOKEN_KEY = 'strava_token';
  const STRAVA_REFRESH_TOKEN_KEY = 'strava_refresh_token';
  const STRAVA_TOKEN_EXPIRATION_DATE_KEY = 'strava_token_expires_at';

  advanceTo(new Date(1644882400)); // 15/02/2022

  const athleteData = {
    id: 25345795,
    username: 'aflaesch',
    resourceState: 2,
    firstname: 'Arnaud',
    lastname: 'Flaesch',
    city: 'Paris',
    state: '',
    country: 'France',
    sex: 'M',
    profileMedium:
      'https://dgalywyr863hv.cloudfront.net/pictures/athletes/25345795/20393158/1/medium.jpg',
    profile: 'https://dgalywyr863hv.cloudfront.net/pictures/athletes/25345795/20393158/1/large.jpg'
  } as IAthlete;

  const activitiesData: IActivity[] = Array(25).fill({
    resourceState: 2,
    athlete: { id: 25345795, resourceState: 0 },
    name: 'Evening Run',
    distance: 10704.7,
    movingTime: 2958,
    elapsedTime: 3118,
    totalElevationGain: 49.2,
    type: 'Run',
    workoutType: 0,
    id: 7.993416249e9,
    externalId: 'ad38998a-3d06-41ee-9e9d-b6bb7c143edf-activity.fit',
    uploadId: 8.550990828e9,
    startDate: '2022-10-20T16:34:39Z',
    startDateLocal: '2022-10-20T18:34:39Z',
    timezone: '(GMT+01:00) Europe/Paris',
    utcOffset: 7200.0,
    startLatlng: [48, 2],
    endLatlng: [48, 2],
    locationCity: undefined,
    locationState: undefined,
    locationCountry: 'France',
    startLatitude: 0,
    startLongitude: 0,
    achievementCount: 1,
    kudosCount: 2,
    commentCount: 0,
    athleteCount: 1,
    photoCount: 0,
    map: { id: 'a7993416249', summaryPolyline: '', resourceState: 0 },
    trainer: false,
    commute: false,
    manual: false,
    private: false,
    visibility: 'everyone',
    flagged: false,
    gearId: 'g11571174',
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

  beforeEach(() => {
    window.localStorage.removeItem(STRAVA_TOKEN_KEY);
    window.localStorage.removeItem(STRAVA_REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY);
  });

  const createComponent = createRoutingFactory({
    component: StravaWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [StravaWidgetService, ErrorHandlerService]
  });
  const createHttp = createHttpFactory(StravaWidgetService);

  function initComponent(): void {
    spectator = createComponent();
    stravaWidgetService = createHttp();
  }

  it('Should display the interface to log in', () => {
    initComponent();
    expect(spectator.component.isUserLoggedIn()).toBe(false);
  });

  it('should create a widget with a token and a refresh token', () => {
    window.localStorage.setItem(STRAVA_TOKEN_KEY, STRAVA_TOKEN);
    window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);
    window.localStorage.setItem(STRAVA_TOKEN_EXPIRATION_DATE_KEY, TOKEN_EXPIRATION_DATE);
    initComponent();
    expect(spectator.component.isUserLoggedIn()).toBe(true);
    expect(spectator.component.isWidgetLoaded).toEqual(true);
    expect(spectator.component.activities).toEqual([]);
    spectator.component.refreshWidget();
    const getAthleteDataRequest = stravaWidgetService.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteData?token=${STRAVA_TOKEN}`,
      HttpMethod.GET
    );
    getAthleteDataRequest.flush(athleteData);

    const getActivitiesRequest = stravaWidgetService.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&pageNumber=1&numberOfActivities=25`,
      HttpMethod.GET
    );
    getActivitiesRequest.flush(activitiesData);

    expect(spectator.component.isWidgetLoaded).toEqual(true);
    expect(spectator.component.activities.length).toEqual(25);
    expect(spectator.component.getActivitiesByMonth()).toEqual({
      '2022-10': [
        10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047,
        10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047, 10.7047,
        10.7047, 10.7047, 10.7047, 10.7047, 10.7047
      ]
    });
    const statsFromActivities = spectator.component.getStatsFromActivities();
    expect(statsFromActivities[0].y).toEqual(268);

    spectator.component.getNextActivitiesPage();

    const getNextActivitiesRequest = stravaWidgetService.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&pageNumber=2&numberOfActivities=25`,
      HttpMethod.GET
    );
    getNextActivitiesRequest.flush([]);
    expect(spectator.component.pageNumber).toEqual(2);

    spectator.component.getPreviousActivitiesPage();
    const getPreviousActivitiesRequest = stravaWidgetService.expectOne(
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&pageNumber=1&numberOfActivities=25`,
      HttpMethod.GET
    );
    getPreviousActivitiesRequest.flush([]);
    expect(spectator.component.pageNumber).toEqual(1);
  });

  it('Should display athlete url', () => {
    expect(spectator.component.getAthleteProfileUrl(athleteData.id)).toEqual(
      'https://www.strava.com/athletes/' + athleteData.id
    );
  });

  it('Should get refresh token', () => {
    initComponent();
    window.localStorage.removeItem(STRAVA_TOKEN_KEY);
    window.localStorage.setItem(STRAVA_REFRESH_TOKEN_KEY, STRAVA_REFRESH_TOKEN);
    spectator.component.getUserData();
    const response = {
      token_type: 'Bearer',
      expiresAt: '1644882561',
      expiresIn: 10384,
      refreshToken: 'REFRESH_TOKEN',
      accessToken: 'TOKEN',
      athlete: {
        id: 25345795,
        username: 'af',
        resource_state: 2,
        firstname: 'A',
        lastname: 'F'
      }
    } as unknown as ITokenData;

    const getRefreshTokenDataRequest = stravaWidgetService.expectOne(
      `${environment.backend_url}/stravaWidget/getRefreshToken`,
      HttpMethod.POST
    );
    getRefreshTokenDataRequest.flush(response);
    expect(spectator.component.isUserLoggedIn()).toEqual(true);
  });
});
