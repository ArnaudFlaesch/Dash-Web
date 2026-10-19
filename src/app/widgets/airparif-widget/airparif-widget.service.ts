import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { IAirParifCouleur, IForecast } from "./model/IAirParif";

@Service()
export class AirParifWidgetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/airParifWidget`;

  public getAirParifWebsiteUrl(): string {
    return "https://www.airparif.asso.fr";
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
