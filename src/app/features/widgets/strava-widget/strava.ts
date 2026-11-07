/**
 * Strava gives the local start date of an activity with a "Z" suffix, although it is not in UTC
 * (ex: "2022-10-20T18:34:39Z" for an activity started at 18:34 where it took place). It is read
 * without this suffix, so that its wall-clock time is kept whatever the timezone of the browser.
 */
export function parseStartDateLocal(startDateLocal: string): Date {
  return new Date(startDateLocal.replace(/Z$/i, ""));
}

/** Activities of a month, the oldest first. */
export interface ActivitiesOfMonth {
  month: Date;
  activities: Activity[];
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  athlete: Athlete;
}

export interface Athlete {
  id: number;
  username: string;
  resourceState: number;
  firstname: string;
  lastname: string;
  city: string;
  state: string;
  country: string;
  sex: string;
  premium: boolean;
  summit: boolean;
  createdAt: Date;
  updatedAt: Date;
  badgeTypeId: number;
  profileMedium: string;
  profile: string;
}

export interface Activity {
  resourceState: number;
  athlete: {
    id: number;
    resourceState: number;
  };
  name: string;
  distance: number;
  movingTime: number;
  elapsedTime: number;
  totalElevationGain: number;
  type: string;
  workoutType: number;
  id: number;
  externalId: string;
  uploadId: number;
  startDate: string;
  startDateLocal: string;
  timezone: string;
  utcOffset: number;
  startLatlng: number[];
  endLatlng: number[];
  locationCity?: string;
  locationState?: string;
  locationCountry: string;
  startLatitude: number;
  startLongitude: number;
  achievementCount: number;
  kudosCount: number;
  commentCount: number;
  athleteCount: number;
  photoCount: number;
  map: {
    id: string;
    summaryPolyline: string;
    resourceState: number;
  };
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  visibility: string;
  flagged: boolean;
  gearId: string;
  fromAcceptedTag: boolean;
  uploadIdStr: string;
  averageSpeed: number;
  maxSpeed: number;
  hasHeartrate: boolean;
  heartrateOptOut: boolean;
  displayHideHeartrateOption: boolean;
  elevHigh: number;
  elevLow: number;
  prCount: number;
  totalPhotoCount: number;
  hasKudoed: boolean;
}
