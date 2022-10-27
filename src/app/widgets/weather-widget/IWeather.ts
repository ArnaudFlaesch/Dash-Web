export interface IForecastAPIResponse {
  cod: string;
  message: number;
  cnt: number;
  list: IForecast[];
  city: ICity;
}

export interface IWeatherAPIResponse {
  coord: LatLng;
  weather: IWeather[];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
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

export interface ICity {
  id: number;
  name: string;
  coord: LatLng;
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}

export interface IForecast {
  dt: number;
  dt_text: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    sea_level: number;
    grnd_level: number;
    humidity: number;
    temp_kf: number;
  };
  weather: IWeather[];
  clouds: {
    all: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  city: ICity;
  sys: {
    pod: string;
  };
}

interface IWeather {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface LatLng {
  lon: number;
  lat: number;
}
