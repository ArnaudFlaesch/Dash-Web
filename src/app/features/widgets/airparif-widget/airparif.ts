export enum ForecastMode {
  TODAY,
  TOMORROW
}

export enum AirparifIndice {
  BON = "Bon",
  MOYEN = "Moyen",
  DEGRADE = "Dégradé",
  MAUVAIS = "Mauvais",
  TRES_MAUVAIS = "Très mauvais",
  EXTREMEMENT_MAUVAIS = "Extrêmement mauvais"
}

export interface AirparifForecast {
  date: string;
  no2: AirparifIndice;
  o3: AirparifIndice;
  pm10: AirparifIndice;
  pm25: AirparifIndice;
  so2: AirparifIndice;
  indice: AirparifIndice;
}

export interface AirparifCouleur {
  name: AirparifIndice;
  color: string;
}

export interface Pollutant {
  key: Exclude<keyof AirparifForecast, "date" | "indice">;
  formula: string;
  name: string;
}

export interface IndiceDetails {
  icon: string;
  advice: string;
}
