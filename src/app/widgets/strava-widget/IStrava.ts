export interface IActivitiesStatsByMonth {
  x: Date;
  y: number;
}

export interface ITokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  athlete: IAthlete;
}

export interface IAthlete {
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

export interface IActivity {
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
  startLatlng: [number, number];
  endLatlng: [number, number];
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
    id: number;
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
  uploadIdStr: number;
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
