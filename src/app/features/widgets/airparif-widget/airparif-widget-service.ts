import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import { AirparifCouleur, AirparifForecast } from "./airparif";

@Service()
export class AirparifWidgetService {
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
