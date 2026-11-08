import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { AirparifIndice, AirparifCouleur, AirparifForecast } from "./airparif";

@Service()
export class AirparifWidgetService {
  public readonly AIRPARIF_WEBSITE_URL = "https://www.airparif.asso.fr";

  /** Class giving the color of the indice, defined in _airparif-widget-theme.scss. */
  public getIndiceClass(indice: AirparifIndice, prefix = "indice"): string {
    return `${prefix}-${indice.toLowerCase().replaceAll("_", "-")}`;
  }

  /** The API sends the keys of the enum (e.g. TRES_MAUVAIS) instead of its labels. */
  public getIndiceLabel(indice: AirparifIndice): string {
    return AirparifIndice[indice as unknown as keyof typeof AirparifIndice] ?? indice;
  }

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/air-parif`;

  public getCommunePrevision(communeInseeCode: string): Observable<AirparifForecast[]> {
    return this.http.get<AirparifForecast[]>(`${this.baseUrl}/forecasts`, {
      params: { commune: communeInseeCode }
    });
  }

  public getColors(): Observable<AirparifCouleur[]> {
    return this.http.get<AirparifCouleur[]>(`${this.baseUrl}/colors`);
  }
}
