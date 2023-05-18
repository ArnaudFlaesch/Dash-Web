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

  const activitiesData: IActivity[] = [
    {
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
    },
    {
      resourceState: 2,
      athlete: { id: 25345795, resourceState: 0 },
      name: 'Evening Run',
      distance: 12397.6,
      movingTime: 2611,
      elapsedTime: 2916,
      totalElevationGain: 102.2,
      type: 'Run',
      workoutType: 0,
      id: 7.978046184e9,
      externalId: '55bbcb3c-6b6c-4e5e-9ddd-310a03a7e0a4-activity.fit',
      uploadId: 8.533704724e9,
      startDate: '2022-10-17T16:12:50Z',
      startDateLocal: '2022-10-17T18:12:50Z',
      timezone: '(GMT+01:00) Europe/Paris',
      utcOffset: 7200.0,
      startLatlng: [48, 2],
      endLatlng: [48, 2],
      locationCity: undefined,
      locationState: undefined,
      locationCountry: 'France',
      startLatitude: 0,
      startLongitude: 0,
      achievementCount: 0,
      kudosCount: 0,
      commentCount: 0,
      athleteCount: 1,
      photoCount: 0,
      map: { id: 'a7978046184', summaryPolyline: '', resourceState: 0 },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: 'everyone',
      flagged: false,
      gearId: 'g11571174',
      fromAcceptedTag: false,
      uploadIdStr: 8.533704724e9,
      averageSpeed: 4.748,
      maxSpeed: 25.746,
      hasHeartrate: false,
      heartrateOptOut: false,
      displayHideHeartrateOption: false,
      elevHigh: 60.1,
      elevLow: 28.1,
      prCount: 0,
      totalPhotoCount: 0,
      hasKudoed: false
    },
    {
      resourceState: 2,
      athlete: { id: 25345795, resourceState: 0 },
      name: 'Lunch Run',
      distance: 10529.8,
      movingTime: 2397,
      elapsedTime: 2489,
      totalElevationGain: 63.6,
      type: 'Run',
      workoutType: 0,
      id: 7.935092006e9,
      externalId: 'fb87134a-6899-4de5-899d-52e268350771-activity.fit',
      uploadId: 8.484120451e9,
      startDate: '2022-10-09T09:44:01Z',
      startDateLocal: '2022-10-09T11:44:01Z',
      timezone: '(GMT+01:00) Europe/Paris',
      utcOffset: 7200.0,
      startLatlng: [48, 2],
      endLatlng: [48, 2],
      locationCity: undefined,
      locationState: undefined,
      locationCountry: 'France',
      startLatitude: 0,
      startLongitude: 0,
      achievementCount: 0,
      kudosCount: 1,
      commentCount: 0,
      athleteCount: 1,
      photoCount: 0,
      map: { id: 'a7935092006', summaryPolyline: '', resourceState: 0 },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: 'everyone',
      flagged: false,
      gearId: 'g11571174',
      fromAcceptedTag: false,
      uploadIdStr: 8.484120451e9,
      averageSpeed: 4.393,
      maxSpeed: 27.142,
      hasHeartrate: false,
      heartrateOptOut: false,
      displayHideHeartrateOption: false,
      elevHigh: 52.7,
      elevLow: 31.6,
      prCount: 0,
      totalPhotoCount: 0,
      hasKudoed: false
    },
    {
      resourceState: 2,
      athlete: { id: 25345795, resourceState: 0 },
      name: 'Afternoon Run',
      distance: 11666.4,
      movingTime: 2331,
      elapsedTime: 2555,
      totalElevationGain: 101.5,
      type: 'Run',
      workoutType: 0,
      id: 7.849958186e9,
      externalId: 'a03d0c6a-47dd-49e7-93dc-3e82316376e7-activity.fit',
      uploadId: 8.388107116e9,
      startDate: '2022-09-22T15:31:15Z',
      startDateLocal: '2022-09-22T17:31:15Z',
      timezone: '(GMT+01:00) Europe/Paris',
      utcOffset: 7200.0,
      startLatlng: [48, 2],
      endLatlng: [48, 2],
      locationCity: undefined,
      locationState: undefined,
      locationCountry: 'France',
      startLatitude: 0,
      startLongitude: 0,
      achievementCount: 0,
      kudosCount: 0,
      commentCount: 0,
      athleteCount: 1,
      photoCount: 0,
      map: { id: 'a7849958186', summaryPolyline: '', resourceState: 0 },
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: 'everyone',
      flagged: false,
      gearId: 'g2726529',
      fromAcceptedTag: false,
      uploadIdStr: 8.388107116e9,
      averageSpeed: 5.005,
      maxSpeed: 36.188,
      hasHeartrate: false,
      heartrateOptOut: false,
      displayHideHeartrateOption: false,
      elevHigh: 52.7,
      elevLow: 29.8,
      prCount: 0,
      totalPhotoCount: 0,
      hasKudoed: false
    }
  ];

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
      `${environment.backend_url}/stravaWidget/getAthleteActivities?token=${STRAVA_TOKEN}&numberOfActivities=20`,
      HttpMethod.GET
    );
    getActivitiesRequest.flush(activitiesData);

    expect(spectator.component.isWidgetLoaded).toEqual(true);
    expect(spectator.component.activities.length).toEqual(4);
    expect(spectator.component.getActivitiesByMonth()).toEqual({
      '2022-09': [11.6664],
      '2022-10': [10.7047, 12.3976, 10.5298]
    });
    const statsFromActivities = spectator.component.getStatsFromActivities();
    expect(statsFromActivities[0].y).toEqual(34);
    expect(statsFromActivities[1].y).toEqual(12);
  });

  it('Should display athlete url', () => {
    expect(spectator.component.getAthleteProfileUrl(athleteData.id)).toEqual(
      'https://www.strava.com/athletes/' + athleteData.id
    );
  });

  it('Should get api token', () => {
    spectator.component.getToken('apicode');
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

    const getTokenDataRequest = stravaWidgetService.expectOne(
      `${environment.backend_url}/stravaWidget/getToken`,
      HttpMethod.POST
    );
    getTokenDataRequest.flush(response);
    expect(spectator.component.isUserLoggedIn()).toEqual(true);
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
