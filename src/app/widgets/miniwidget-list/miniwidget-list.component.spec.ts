import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import { vi } from "vitest";
import { environment } from "../../../environments/environment";
import { MiniWidgetTypeEnum } from "../../enums/MiniWidgetTypeEnum";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { MiniWidgetService } from "../../services/widget.service/miniwidget.service";
import { MiniWidgetListComponent } from "./miniwidget-list.component";
import { provideHttpClient } from "@angular/common/http";
import { WeatherWidgetService } from "../weather-widget/weather.widget.service";
import { WidgetService } from "../../services/widget.service/widget.service";
import { WIDGET_DATA, WIDGET_ID } from "../widget.tokens";

describe("MiniWidgetListComponent", () => {
  let component: MiniWidgetListComponent;
  let httpTestingController: HttpTestingController;
  let dialogResult: string | undefined;

  const miniWidgetPath = environment.backend_url + "/miniWidget/";

  beforeEach(async () => {
    dialogResult = undefined;
    await TestBed.configureTestingModule({
      providers: [
        MiniWidgetService,
        WidgetService,
        ErrorHandlerService,
        WeatherWidgetService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: MatDialog,
          useValue: {
            open: (): { afterClosed: () => Observable<string | undefined> } => ({
              afterClosed: (): Observable<string | undefined> => of(dialogResult)
            })
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(MiniWidgetListComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  function loadMiniWidgets(): void {
    component.ngOnInit();
    httpTestingController.expectOne(miniWidgetPath).flush([
      {
        id: 70,
        type: MiniWidgetTypeEnum.WEATHER,
        data: { city: "Paris" }
      }
    ]);
  }

  it("should have no widgets", () => {
    loadMiniWidgets();
    expect(component.miniWidgetList().length).toEqual(1);
  });

  it("Should handle an error while loading the mini widgets", () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    component.ngOnInit();
    httpTestingController
      .expectOne(miniWidgetPath)
      .flush(null, { status: 500, statusText: "Server error" });
    expect(handleErrorSpy).toHaveBeenCalled();
    expect(component.miniWidgetList()).toEqual([]);
  });

  it("Should add a mini widget from the creation modal", () => {
    loadMiniWidgets();
    dialogResult = "WEATHER";
    component.openCreateMiniWidgetModal();
    const request = httpTestingController.expectOne(miniWidgetPath + "addMiniWidget");
    expect(request.request.body).toEqual({ type: MiniWidgetTypeEnum.WEATHER });
    request.flush({ id: 71, type: MiniWidgetTypeEnum.WEATHER });
    expect(component.miniWidgetList().map((miniWidget) => miniWidget.id)).toEqual([70, 71]);
  });

  it("Should not add a mini widget when the modal is closed", () => {
    component.openCreateMiniWidgetModal();
    httpTestingController.expectNone(miniWidgetPath + "addMiniWidget");
  });

  it("Should delete a mini widget", () => {
    loadMiniWidgets();
    TestBed.inject(MiniWidgetService).notifyMiniWidgetDeleted(70);
    httpTestingController.expectOne(miniWidgetPath + "deleteMiniWidget?widgetId=70").flush(null);
    expect(component.miniWidgetList()).toEqual([]);
  });

  it("Should provide the mini widget id and data to each mini widget", () => {
    loadMiniWidgets();
    const miniWidget = component.miniWidgetList()[0];
    const injector = component.getMiniWidgetInjector(miniWidget);
    expect(injector.get(WIDGET_ID)).toEqual(70);
    expect(injector.get(WIDGET_DATA)).toEqual({ city: "Paris" });
    expect(component.getMiniWidgetInjector(miniWidget)).toBe(injector);
  });
});
