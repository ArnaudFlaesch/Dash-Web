import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { MiniWidgetTypeEnum } from "@enums/MiniWidgetTypeEnum";
import { IMiniWidgetConfig } from "@model/IMiniWidgetConfig";
import { MiniWidgetService } from "./mini-widget.service";

describe("MiniWidgetService", () => {
  let miniWidgetService: MiniWidgetService;
  let httpTestingController: HttpTestingController;

  const miniWidgetUrl = `${environment.backend_url}/miniWidget`;
  const miniWidget: IMiniWidgetConfig = {
    id: 1,
    type: MiniWidgetTypeEnum.WEATHER,
    data: { city: "Paris" }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    miniWidgetService = TestBed.inject(MiniWidgetService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("Should notify the deleted mini widgets", () => {
    const deletedSpy = vi.fn();
    miniWidgetService.miniWidgetDeleted.subscribe(deletedSpy);
    miniWidgetService.notifyMiniWidgetDeleted(2);
    expect(deletedSpy).toHaveBeenCalledWith(2);
  });

  it("Should get the mini widgets", () => {
    let miniWidgets: IMiniWidgetConfig[] = [];
    miniWidgetService.getMiniWidgets().subscribe((response) => (miniWidgets = response));
    const request = httpTestingController.expectOne(`${miniWidgetUrl}/`);
    expect(request.request.method).toEqual("GET");
    request.flush([miniWidget]);
    expect(miniWidgets).toEqual([miniWidget]);
  });

  it("Should add a mini widget", () => {
    miniWidgetService.addMiniWidget(MiniWidgetTypeEnum.WEATHER).subscribe();
    const request = httpTestingController.expectOne(`${miniWidgetUrl}/addMiniWidget`);
    expect(request.request.method).toEqual("POST");
    expect(request.request.body).toEqual({ type: MiniWidgetTypeEnum.WEATHER });
    request.flush(miniWidget);
  });

  it("Should update the data of a mini widget", () => {
    miniWidgetService.updateWidgetData(1, { city: "Lyon" }).subscribe();
    const request = httpTestingController.expectOne(`${miniWidgetUrl}/updateWidgetData/1`);
    expect(request.request.method).toEqual("PATCH");
    expect(request.request.body).toEqual({ data: { city: "Lyon" } });
    request.flush(miniWidget);
  });

  it("Should delete a mini widget", () => {
    miniWidgetService.deleteMiniWidget(1).subscribe();
    const request = httpTestingController.expectOne(`${miniWidgetUrl}/deleteMiniWidget?widgetId=1`);
    expect(request.request.method).toEqual("DELETE");
    request.flush(null);
  });
});
