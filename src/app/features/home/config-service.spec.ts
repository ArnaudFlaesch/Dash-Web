import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { ConfigService } from "./config-service";

describe("ConfigService", () => {
  let configService: ConfigService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    configService = TestBed.inject(ConfigService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("Should export the configuration as a blob", () => {
    const config = new Blob(["{}"]);
    let exportedConfig: Blob | undefined;
    configService.exportConfig().subscribe((blob) => (exportedConfig = blob));

    const request = httpTestingController.expectOne(`${environment.backend_url}/dash-config`);
    expect(request.request.method).toEqual("GET");
    expect(request.request.responseType).toEqual("blob");
    request.flush(config);
    expect(exportedConfig).toEqual(config);
  });

  it("Should import the configuration file as form data", () => {
    const file = new File(["{}"], "dashboardConfig.json");
    let completed = false;
    configService.importConfig(file).subscribe({ complete: () => (completed = true) });

    const request = httpTestingController.expectOne(`${environment.backend_url}/dash-config`);
    expect(request.request.method).toEqual("POST");
    expect((request.request.body as FormData).get("file")).toEqual(file);
    request.flush(null, { status: 204, statusText: "No Content" });
    expect(completed).toBe(true);
  });
});
