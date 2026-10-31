import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { AirParifIndiceEnum, IAirParifCouleur, IForecast } from "./model/IAirParif";

@Service()
export class AirParifWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/airParifWidget`;

  public getAirParifWebsiteUrl(): string {
    return "https://www.airparif.asso.fr";
  }

  // Class giving the color of the indice, defined in _airparif-widget.theme.scss
  public getIndiceClass(indice: AirParifIndiceEnum, prefix = "indice"): string {
    return `${prefix}-${indice.toLowerCase().replaceAll("_", "-")}`;
  }

  // The API sends the keys of the enum (e.g. TRES_MAUVAIS) instead of its labels
  public getIndiceLabel(indice: AirParifIndiceEnum): string {
    return AirParifIndiceEnum[indice as unknown as keyof typeof AirParifIndiceEnum] ?? indice;
  }

  public getCommunePrevision(communeInseeCode: string): Observable<IForecast[]> {
    return this.http.get<IForecast[]>(
      `${this.baseUrl}/previsionCommune?commune=${communeInseeCode}`
    );
  }

  public getColors(): Observable<IAirParifCouleur[]> {
    return this.http.get<IAirParifCouleur[]>(`${this.baseUrl}/couleurs`);
  }
}
