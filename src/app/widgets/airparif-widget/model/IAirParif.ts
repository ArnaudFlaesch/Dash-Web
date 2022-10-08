export interface IForecast {
  date: string;
  no2: AirParifIndiceEnum;
  o3: AirParifIndiceEnum;
  pm10: AirParifIndiceEnum;
  pm25: AirParifIndiceEnum;
  so2: AirParifIndiceEnum;
  indice: AirParifIndiceEnum;
}

enum AirParifIndiceEnum {
  BON,
  MOYEN,
  DEGRADE,
  MAUVAIS,
  TRES_MAUVAIS,
  EXTREMEMENT_MAUVAIS
}

export interface IAirParifCouleur {
  bon: string;
  moyen: string;
  degrade: string;
  mauvais: string;
  tresMauvais: string;
  extremementMauvais: string;
}
