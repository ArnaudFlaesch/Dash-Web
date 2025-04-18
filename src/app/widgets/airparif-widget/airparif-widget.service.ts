import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import authorizationBearer from "../../services/authorizationBearer/authorizationBearer";
import { environment } from "../../../environments/environment";
import { IAirParifCouleur, IForecast } from "./model/IAirParif";

@Injectable()
export class AirParifWidgetService {
  private readonly http = inject(HttpClient);

  public getAirParifWebsiteUrl(): string {
    return "https://www.airparif.asso.fr";
  }

  public getCommunePrevision(communeInseeCode: string): Observable<IForecast[]> {
    return this.http.get<IForecast[]>(
      `${environment.backend_url}/airParifWidget/previsionCommune?commune=${communeInseeCode}`,
      {
        headers: {
          Authorization: authorizationBearer(),
          "Content-type": "application/json"
        }
      }
    );
  }

  public getColors(): Observable<IAirParifCouleur[]> {
    return this.http.get<IAirParifCouleur[]>(`${environment.backend_url}/airParifWidget/couleurs`, {
      headers: {
        Authorization: authorizationBearer(),
        "Content-type": "application/json"
      }
    });
  }
}
