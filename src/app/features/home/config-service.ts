import { HttpClient } from "@angular/common/http";
import { inject, Service } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";

@Service()
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backend_url}/dash-config`;

  public exportConfig(): Observable<Blob> {
    return this.http.get(this.baseUrl, { responseType: "blob" });
  }

  public importConfig(file: File): Observable<void> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<void>(this.baseUrl, formData);
  }
}
