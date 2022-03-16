import { IAthlete } from './IStrava';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  createHttpFactory,
  createRoutingFactory,
  HttpMethod,
  SpectatorHttp,
  SpectatorRouting
} from '@ngneat/spectator/jest';
import { addDays, getTime } from 'date-fns';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { StravaWidgetService } from './strava.widget.service';
import { StravaWidgetComponent } from './strava-widget.component';

describe('StravaWidgetComponent', () => {
  let spectator: SpectatorRouting<StravaWidgetComponent>;
  let stravaWidgetService: SpectatorHttp<StravaWidgetService>;

  const STRAVA_TOKEN = 'FAKE_TOKEN';
  const STRAVA_REFRESH_TOKEN = 'FAKE_REFRESH_TOKEN';
  const TOKEN_EXPIRATION_DATE = getTime(addDays(new Date(), 4)).toString();

  const STRAVA_TOKEN_KEY = 'strava_token';
  const STRAVA_REFRESH_TOKEN_KEY = 'strava_refresh_token';
  const STRAVA_TOKEN_EXPIRATION_DATE_KEY = 'strava_token_expires_at';

  const athleteData = {
    id: 25345795,
    username: 'aflaesch',
    resource_state: 2,
    firstname: 'Arnaud',
    lastname: 'Flaesch',
    city: 'Paris',
    state: '',
    country: 'France',
    sex: 'M',
    profile_medium:
      'https://dgalywyr863hv.cloudfront.net/pictures/athletes/25345795/20393158/1/medium.jpg',
    profile: 'https://dgalywyr863hv.cloudfront.net/pictures/athletes/25345795/20393158/1/large.jpg'
  };

  const activitiesData = [
    {
      resource_state: 2,
      athlete: { id: 25345795, resource_state: 1 },
      name: 'Afternoon Run',
      distance: 12518.8,
      moving_time: 2506,
      elapsed_time: 2677,
      total_elevation_gain: 78.7,
      type: 'Run',
      workout_type: 0,
      id: 6678022130,
      start_date: '2022-02-13T15:07:22Z',
      start_date_local: '2022-02-13T16:07:22Z',
      timezone: '(GMT+01:00) Europe/Paris',
      utc_offset: 3600.0,
      location_city: null,
      location_state: null,
      location_country: 'France',
      achievement_count: 10,
      kudos_count: 0,
      comment_count: 0,
      athlete_count: 1,
      photo_count: 0,
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: 'everyone',
      flagged: false,
      gear_id: 'g2726529',
      average_speed: 4.996,
      max_speed: 35.688,
      has_heartrate: false,
      heartrate_opt_out: false,
      display_hide_heartrate_option: false,
      elev_high: 56.8,
      elev_low: 30.2,
      upload_id: 7101918838,
      upload_id_str: '7101918838',
      external_id: '73ca9a31-3269-4420-9134-61892b35cf6e-activity.fit',
      from_accepted_tag: false,
      pr_count: 4,
      total_photo_count: 0,
      has_kudoed: false
    },
    {
      resource_state: 2,
      athlete: { id: 25345795, resource_state: 1 },
      name: 'Afternoon Run',
      distance: 8608.7,
      moving_time: 2136,
      elapsed_time: 2140,
      total_elevation_gain: 111.8,
      type: 'Run',
      workout_type: 0,
      id: 6122134363,
      start_date: '2021-10-16T15:31:10Z',
      start_date_local: '2021-10-16T17:31:10Z',
      timezone: '(GMT+01:00) Europe/Paris',
      utc_offset: 7200.0,
      location_city: null,
      location_state: null,
      location_country: 'France',
      achievement_count: 1,
      kudos_count: 1,
      comment_count: 0,
      athlete_count: 1,
      photo_count: 0,
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: 'everyone',
      flagged: false,
      gear_id: 'g2726529',
      average_speed: 4.03,
      max_speed: 28.2,
      has_heartrate: false,
      heartrate_opt_out: false,
      display_hide_heartrate_option: false,
      elev_high: 62.8,
      elev_low: 28.0,
      upload_id: 6505950938,
      upload_id_str: '6505950938',
      external_id: 'c6a0a1c1-7116-4309-90a5-b7e35eeb86ac-activity.fit',
      from_accepted_tag: false,
      pr_count: 1,
      total_photo_count: 0,
      has_kudoed: false
    },
    {
      resource_state: 2,
      athlete: { id: 25345795, resource_state: 1 },
      name: 'Evening Run',
      distance: 6330.4,
      moving_time: 1515,
      elapsed_time: 1621,
      total_elevation_gain: 71.2,
      type: 'Run',
      workout_type: 0,
      id: 6067954599,
      start_date: '2021-10-05T16:23:43Z',
      start_date_local: '2021-10-05T18:23:43Z',
      timezone: '(GMT+01:00) Europe/Paris',
      utc_offset: 7200.0,
      location_city: null,
      location_state: null,
      location_country: 'France',
      achievement_count: 6,
      kudos_count: 2,
      comment_count: 0,
      athlete_count: 1,
      photo_count: 0,
      trainer: false,
      commute: false,
      manual: false,
      private: false,
      visibility: 'everyone',
      flagged: false,
      gear_id: 'g2726529',
      average_speed: 4.178,
      max_speed: 19.1,
      has_heartrate: false,
      heartrate_opt_out: false,
      display_hide_heartrate_option: false,
      elev_high: 58.1,
      elev_low: 25.0,
      upload_id: 6448673229,
      upload_id_str: '6448673229',
      external_id: 'b7ee329b-e1ad-414b-8aa6-12f0ebea27b8-activity.fit',
      from_accepted_tag: false,
      pr_count: 6,
      total_photo_count: 0,
      has_kudoed: false
    }
  ];

  const createComponent = createRoutingFactory({
    component: StravaWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [StravaWidgetService, ErrorHandlerService]
  });
  const createHttp = createHttpFactory(StravaWidgetService);

  function initComponent() {
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
    expect(spectator.component.activities).toEqual([]);
    spectator.component.refreshWidget();
    const getAthleteDataRequest = stravaWidgetService.expectOne(
      stravaWidgetService.service.GET_ATHLETE_DATA_URL,
      HttpMethod.GET
    );
    getAthleteDataRequest.flush(athleteData);

    const getActivitiesRequest = stravaWidgetService.expectOne(
      stravaWidgetService.service.GET_ACTIVITIES_URL + '20',
      HttpMethod.GET
    );
    getActivitiesRequest.flush(activitiesData);
    expect(spectator.component.activities.length).toEqual(3);
    expect(spectator.component.getActivitiesByMonth()).toEqual({
      '2021-10': [6.3304, 8.6087],
      '2022-02': [12.5188]
    });
    expect(spectator.component.getStatsFromActivities()).toEqual([
      { x: new Date('2021-10-01T02:00:00'), y: 15 },
      { x: new Date('2022-02-01T01:00:00'), y: 13 }
    ]);
  });
});
