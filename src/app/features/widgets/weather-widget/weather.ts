export enum ForecastMode {
  DAY,
  WEEK
}

export interface ForecastApiResponse {
  cod: string;
  message: number;
  cnt: number;
  list: Forecast[];
  city: City;
}

export interface WeatherApiResponse {
  coord: LatLng;
  weather: WeatherCondition[];
  base: string;
  main: {
    temp: number;
    feelsLike: number;
    tempMin: number;
    tempMax: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust: number;
  };
  clouds: {
    all: string | number;
  };
  dt: number;
  sys: {
    id: number;
    type: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface City {
  id: number;
  name: string;
  coord: LatLng;
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}

export interface Forecast {
  dt: number;
  dtText: string;
  main: {
    temp: number;
    feelsLike: number;
    tempMin: number;
    tempMax: number;
    pressure: number;
    seaLevel: number;
    grndLevel: number;
    humidity: number;
    tempKf: number;
  };
  weather: WeatherCondition[];
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  sys: {
    pod: string;
  };
}

interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface LatLng {
  lon: number;
  lat: number;
}
