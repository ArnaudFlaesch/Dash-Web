import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Service()
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/dashConfig`;

  public exportConfig(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { responseType: "blob" });
  }

  public importConfig(file: File): Observable<boolean> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<boolean>(`${this.baseUrl}/import`, formData);
  }
}
