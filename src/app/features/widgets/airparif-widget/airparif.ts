export const AIRPARIF_WEBSITE_URL = "https://www.airparif.asso.fr";

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

/** Class giving the color of the indice, defined in _airparif-widget-theme.scss. */
export function getIndiceClass(indice: AirparifIndice, prefix = "indice"): string {
  return `${prefix}-${indice.toLowerCase().replaceAll("_", "-")}`;
}

/** The API sends the keys of the enum (e.g. TRES_MAUVAIS) instead of its labels. */
export function getIndiceLabel(indice: AirparifIndice): string {
  return AirparifIndice[indice as unknown as keyof typeof AirparifIndice] ?? indice;
}
