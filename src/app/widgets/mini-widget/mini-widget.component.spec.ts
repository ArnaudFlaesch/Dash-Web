import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "../../../environments/environment";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { MiniWidgetService } from "../../services/widget.service/miniwidget.service";
import { WIDGET_ID } from "../widget.tokens";
import { MiniWidgetComponent } from "./mini-widget.component";

describe("MiniWidgetComponent", () => {
  const miniWidgetId = 8;
  let fixture: ComponentFixture<MiniWidgetComponent>;
  let component: MiniWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: miniWidgetId }
      ]
    });
    fixture = TestBed.createComponent(MiniWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput("widgetData", { city: "Lyon" });
    fixture.componentRef.setInput("isFormValid", true);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("Should save the mini widget data and refresh it", () => {
    const refreshSpy = vi.fn();
    component.refreshWidgetAction.subscribe(refreshSpy);

    component.onValidation();
    httpTestingController
      .expectOne(`${environment.backend_url}/miniWidget/updateWidgetData/${miniWidgetId}`)
      .flush({});

    expect(component.isModeRead()).toBe(true);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("Should display an error when the mini widget data can't be saved", () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    component.onValidation();
    httpTestingController
      .expectOne(`${environment.backend_url}/miniWidget/updateWidgetData/${miniWidgetId}`)
      .flush(null, { status: 500, statusText: "Server error" });
    expect(handleErrorSpy).toHaveBeenCalled();
  });

  it("Should notify the mini widget deletion", () => {
    const deletedSpy = vi.fn();
    TestBed.inject(MiniWidgetService).miniWidgetDeleted.subscribe(deletedSpy);
    component.deleteMiniWidget();
    expect(deletedSpy).toHaveBeenCalledWith(miniWidgetId);
  });
});
