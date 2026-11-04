import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "../../environments/environment";
import { WidgetTypeEnum } from "../enums/WidgetTypeEnum";
import { IWidgetConfig } from "../model/IWidgetConfig";
import { WidgetService } from "./widget.service";

describe("WidgetService", () => {
  let widgetService: WidgetService;
  let httpTestingController: HttpTestingController;

  const widgetUrl = `${environment.backend_url}/widget`;
  const widget: IWidgetConfig = {
    id: 1,
    type: WidgetTypeEnum.RSS,
    data: { url: "url.rss.xml" },
    widgetOrder: 1,
    tabId: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    widgetService = TestBed.inject(WidgetService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("Should notify the deleted widgets and the refresh requests", () => {
    const deletedSpy = vi.fn();
    const refreshSpy = vi.fn();
    widgetService.widgetDeleted.subscribe(deletedSpy);
    widgetService.refreshWidgetsAction.subscribe(refreshSpy);

    widgetService.notifyWidgetDeleted(3);
    widgetService.refreshAllWidgets();

    expect(deletedSpy).toHaveBeenCalledWith(3);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("Should get the widgets of a tab", () => {
    let widgets: IWidgetConfig[] = [];
    widgetService.getWidgets(1).subscribe((response) => (widgets = response));
    const request = httpTestingController.expectOne(`${widgetUrl}/?tabId=1`);
    expect(request.request.method).toEqual("GET");
    request.flush([widget]);
    expect(widgets).toEqual([widget]);
  });

  it("Should add a widget to a tab", () => {
    widgetService.addWidget(WidgetTypeEnum.WEATHER, 2).subscribe();
    const request = httpTestingController.expectOne(`${widgetUrl}/addWidget`);
    expect(request.request.method).toEqual("POST");
    expect(request.request.body).toEqual({ type: WidgetTypeEnum.WEATHER, tabId: 2 });
    request.flush(widget);
  });

  it("Should update the data of a widget", () => {
    widgetService.updateWidgetData(1, { url: "other.rss.xml" }).subscribe();
    const request = httpTestingController.expectOne(`${widgetUrl}/updateWidgetData/1`);
    expect(request.request.method).toEqual("PATCH");
    expect(request.request.body).toEqual({ data: { url: "other.rss.xml" } });
    request.flush(widget);
  });

  it("Should update the order of the widgets", () => {
    widgetService.updateWidgetsOrder([widget]).subscribe();
    const request = httpTestingController.expectOne(`${widgetUrl}/updateWidgetsOrder`);
    expect(request.request.method).toEqual("POST");
    expect(request.request.body).toEqual([widget]);
    request.flush([widget]);
  });

  it("Should delete a widget", () => {
    widgetService.deleteWidget(1).subscribe();
    const request = httpTestingController.expectOne(`${widgetUrl}/deleteWidget?id=1`);
    expect(request.request.method).toEqual("DELETE");
    request.flush(null);
  });
});
