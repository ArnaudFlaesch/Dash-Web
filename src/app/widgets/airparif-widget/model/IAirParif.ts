export enum ForecastMode {
  TODAY,
  TOMORROW
}

export enum AirParifIndiceEnum {
  BON = "Bon",
  MOYEN = "Moyen",
  DEGRADE = "Dégradé",
  MAUVAIS = "Mauvais",
  TRES_MAUVAIS = "Très mauvais",
  EXTREMEMENT_MAUVAIS = "Extrêmement mauvais"
}

export type IForecast = {
  date: string;
  no2: AirParifIndiceEnum;
  o3: AirParifIndiceEnum;
  pm10: AirParifIndiceEnum;
  pm25: AirParifIndiceEnum;
  so2: AirParifIndiceEnum;
  indice: AirParifIndiceEnum;
};

export type IAirParifCouleur = {
  name: AirParifIndiceEnum;
  color: string;
};
