import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "../../../environments/environment";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { WidgetService } from "../../services/widget.service/widget.service";
import { WIDGET_ID } from "../widget.tokens";
import { WidgetComponent } from "./widget.component";

describe("WidgetComponent", () => {
  const widgetId = 5;
  let fixture: ComponentFixture<WidgetComponent>;
  let component: WidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: widgetId }
      ]
    });
    fixture = TestBed.createComponent(WidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput("widgetData", { city: "Paris" });
    fixture.componentRef.setInput("isFormValid", true);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("Should save the widget data, switch to read mode and refresh the widget", () => {
    const refreshSpy = vi.fn();
    component.refreshWidgetAction.subscribe(refreshSpy);

    component.onValidation();
    const request = httpTestingController.expectOne(
      `${environment.backend_url}/widget/updateWidgetData/${widgetId}`
    );
    expect(request.request.body).toEqual({ data: { city: "Paris" } });
    request.flush({});

    expect(component.isModeRead()).toBe(true);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it("Should display an error when the widget data can't be saved", () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    component.onValidation();
    httpTestingController
      .expectOne(`${environment.backend_url}/widget/updateWidgetData/${widgetId}`)
      .flush(null, { status: 500, statusText: "Server error" });
    expect(handleErrorSpy).toHaveBeenCalled();
    expect(component.isModeEdit()).toBe(true);
  });

  it("Should switch between modes and notify the widget deletion", () => {
    const deletedSpy = vi.fn();
    TestBed.inject(WidgetService).widgetDeleted.subscribe(deletedSpy);

    component.toDeleteMode();
    expect(component.isModeDelete()).toBe(true);
    component.cancelEdition();
    expect(component.isModeRead()).toBe(true);

    component.deleteWidget();
    expect(deletedSpy).toHaveBeenCalledWith(widgetId);
  });

  it("Should stay in edit mode while the widget has no data", () => {
    fixture.componentRef.setInput("widgetData", undefined);
    component.toReadMode();
    expect(component.isModeEdit()).toBe(true);
  });
});
