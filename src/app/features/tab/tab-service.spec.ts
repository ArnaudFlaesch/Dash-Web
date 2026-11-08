import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { Tab } from "@features/tab/tab";
import { TabService } from "./tab-service";

describe("TabService", () => {
  let tabService: TabService;
  let httpTestingController: HttpTestingController;

  const tabUrl = `${environment.backend_url}/tabs`;
  const tab: Tab = { id: 1, label: "Flux RSS", tabOrder: 1 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    tabService = TestBed.inject(TabService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("Should get the tabs", () => {
    let tabs: Tab[] = [];
    tabService.getTabs().subscribe((response) => (tabs = response));
    const request = httpTestingController.expectOne(tabUrl);
    expect(request.request.method).toEqual("GET");
    request.flush([tab]);
    expect(tabs).toEqual([tab]);
  });

  it("Should add a tab", () => {
    tabService.addTab("Nouvel onglet").subscribe();
    const request = httpTestingController.expectOne(tabUrl);
    expect(request.request.method).toEqual("POST");
    expect(request.request.body).toEqual({ label: "Nouvel onglet" });
    request.flush(tab);
  });

  it("Should update a tab", () => {
    tabService.updateTab(1, "Météo", 2).subscribe();
    const request = httpTestingController.expectOne(`${tabUrl}/1`);
    expect(request.request.method).toEqual("PUT");
    expect(request.request.body).toEqual({ label: "Météo", tabOrder: 2 });
    request.flush({ id: 1, label: "Météo", tabOrder: 2 });
  });

  it("Should update all the tabs", () => {
    tabService.updateTabs([tab]).subscribe();
    const request = httpTestingController.expectOne(tabUrl);
    expect(request.request.method).toEqual("PATCH");
    expect(request.request.body).toEqual([tab]);
    request.flush([tab]);
  });

  it("Should delete a tab", () => {
    tabService.deleteTab(1).subscribe();
    const request = httpTestingController.expectOne(`${tabUrl}/1`);
    expect(request.request.method).toEqual("DELETE");
    request.flush(null);
  });
});
