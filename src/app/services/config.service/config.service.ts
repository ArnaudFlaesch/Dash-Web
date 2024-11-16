import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { environment } from "../../../environments/environment";
import authorizationBearer from "../authorizationBearer/authorizationBearer";

@Injectable()
export class ConfigService {
  private http = inject(HttpClient);

  public exportConfig(): Observable<BlobPart> {
    return this.http.get(`${environment.backend_url}/dashConfig/export`, {
      headers: {
        Authorization: authorizationBearer(),
        "Content-type": "application/json"
      },
      responseType: "blob"
    });
  }

  public importConfig(file: File): Observable<boolean> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<boolean>(`${environment.backend_url}/dashConfig/import`, formData, {
      headers: {
        Authorization: authorizationBearer()
      }
    });
  }
}
