export interface IAthlete {
  id: number;
  username: string;
  resource_state: 2;
  firstname: string;
  lastname: string;
  city: string;
  state: string;
  country: string;
  sex: string;
  premium: boolean;
  summit: boolean;
  created_at: Date;
  updated_at: Date;
  badge_type_id: number;
  profile_medium: string;
  profile: string;
  friend: unknown;
  follower: unknown;
}

export interface IActivity {
  resource_state: number;
  athlete: {
    id: number;
    resource_state: number;
  };
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  workout_type: number;
  id: number;
  external_id: string;
  upload_id: number;
  start_date: Date;
  start_date_local: Date;
  timezone: string;
  utc_offset: number;
  start_latlng: [number, number];
  end_latlng: [number, number];
  location_city: string;
  location_state: string;
  location_country: string;
  start_latitude: number;
  start_longitude: number;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: {
    id: number;
    summary_polyline: string;
    resource_state: number;
  };
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  visibility: string;
  flagged: boolean;
  gear_id: string;
  from_accepted_tag: boolean;
  upload_id_str: number;
  average_speed: number;
  max_speed: number;
  has_heartrate: boolean;
  heartrate_opt_out: boolean;
  display_hide_heartrate_option: boolean;
  elev_high: number;
  elev_low: number;
  pr_count: number;
  total_photo_count: number;
  has_kudoed: boolean;
}
