import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { MiniWidgetService } from "@widgets/mini-widget-service";
import { WIDGET_ID } from "@widgets/widget.tokens";
import { MiniWidget } from "./mini-widget";

describe("MiniWidget", () => {
  const miniWidgetId = 8;
  let fixture: ComponentFixture<MiniWidget>;
  let component: MiniWidget;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: miniWidgetId }
      ]
    });
    fixture = TestBed.createComponent(MiniWidget);
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

@Component({
  template: `
    <dash-mini-widget
      [widgetData]="widgetData()"
      [isFormValid]="isFormValid()"
      [isWidgetLoaded]="isWidgetLoaded()"
      (refreshWidgetAction)="refreshCount = refreshCount + 1"
    >
      <ng-template #editComponent><input class="test-edit-component" /></ng-template>
      <ng-template #body><div class="test-body">Body</div></ng-template>
    </dash-mini-widget>
  `,
  imports: [MiniWidget]
})
class MiniWidgetHost {
  public readonly widgetData = signal<Record<string, unknown> | undefined>({ city: "Lyon" });
  public readonly isFormValid = signal(true);
  public readonly isWidgetLoaded = signal(true);
  public refreshCount = 0;
}

describe("MiniWidget template", () => {
  const miniWidgetId = 8;
  let fixture: ComponentFixture<MiniWidgetHost>;
  let host: MiniWidgetHost;
  let miniWidget: MiniWidget;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: miniWidgetId }
      ]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  async function createHost(
    widgetData: Record<string, unknown> | undefined,
    isWidgetLoaded = true
  ): Promise<void> {
    fixture = TestBed.createComponent(MiniWidgetHost);
    host = fixture.componentInstance;
    host.widgetData.set(widgetData);
    host.isWidgetLoaded.set(isWidgetLoaded);
    element = fixture.nativeElement;
    await fixture.whenStable();
    miniWidget = fixture.debugElement.children[0].componentInstance;
  }

  function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return element.querySelector<T>(selector);
  }

  describe("Edit mode", () => {
    beforeEach(async () => {
      await createHost(undefined);
    });

    it("Should display the edit component without the cancel button", () => {
      expect(query(".edit-mini-widget .test-edit-component")).toBeTruthy();
      expect(query(".validate-button")).toBeTruthy();
      expect(query(".cancel-button")).toBeNull();
      expect(query(".test-body")).toBeNull();
    });

    it("Should only allow the validation of a valid form", async () => {
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(false);
      host.isFormValid.set(false);
      await fixture.whenStable();
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
    });

    it("Should save the mini widget data on validation", async () => {
      host.widgetData.set({ city: "Lyon" });
      await fixture.whenStable();
      const initialRefreshCount = host.refreshCount;
      query(".validate-button")?.click();
      const request = httpTestingController.expectOne(
        `${environment.backend_url}/miniWidget/updateWidgetData/${miniWidgetId}`
      );
      expect(request.request.method).toEqual("PATCH");
      expect(request.request.body).toEqual({ data: { city: "Lyon" } });
      request.flush({});
      await fixture.whenStable();

      expect(query(".test-body")).toBeTruthy();
      expect(query(".edit-mini-widget")).toBeNull();
      expect(host.refreshCount).toEqual(initialRefreshCount + 1);
    });

    it("Should display an error and stay in edit mode when the data can't be saved", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      query(".validate-button")?.click();
      httpTestingController
        .expectOne(`${environment.backend_url}/miniWidget/updateWidgetData/${miniWidgetId}`)
        .flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        "Erreur lors de la mise à jour de la configuration du widget."
      );
      expect(query(".edit-mini-widget")).toBeTruthy();
    });

    it("Should ask a confirmation before deleting the mini widget", async () => {
      const deletedSpy = vi.fn();
      TestBed.inject(MiniWidgetService).miniWidgetDeleted.subscribe(deletedSpy);
      element.querySelectorAll<HTMLButtonElement>(".edit-mini-widget button")[1].click();
      await fixture.whenStable();

      expect(query(".delete-mini-widget h4")?.textContent).toEqual(
        miniWidget.labels.confirmDeletion
      );
      expect(query(".delete-mini-widget .cancel-button")?.textContent?.trim()).toEqual(
        miniWidget.labels.cancel
      );
      const validateDeletionButton = query(".delete-mini-widget .validate-deletion-button");
      expect(validateDeletionButton?.textContent?.trim()).toEqual(miniWidget.labels.delete);
      expect(query(".edit-mini-widget")).toBeNull();

      validateDeletionButton?.click();
      expect(deletedSpy).toHaveBeenCalledWith(miniWidgetId);
    });

    it("Should go back to edit mode when the deletion of a mini widget without data is cancelled", async () => {
      miniWidget.toDeleteMode();
      await fixture.whenStable();
      query(".delete-mini-widget .cancel-button")?.click();
      await fixture.whenStable();
      expect(query(".delete-mini-widget")).toBeNull();
      expect(query(".edit-mini-widget")).toBeTruthy();
    });
  });

  describe("Read mode", () => {
    it("Should display the body of a loaded mini widget", async () => {
      await createHost({ city: "Lyon" });
      expect(query(".read-mini-widget-body-container .test-body")).toBeTruthy();
      expect(query("mat-spinner")).toBeNull();
      expect(query(".edit-mini-widget")).toBeNull();
      // Refreshed once on initialization, as the form is valid
      expect(host.refreshCount).toEqual(1);
    });

    it("Should display a spinner while the mini widget is loading", async () => {
      await createHost({ city: "Lyon" }, false);
      expect(query(".loading-spinner mat-spinner")).toBeTruthy();
      expect(query(".test-body")).toBeNull();
    });

    it("Should edit the mini widget on double click, then cancel the edition", async () => {
      await createHost({ city: "Lyon" });
      query(".read-mini-widget-body-container")?.dispatchEvent(
        new MouseEvent("dblclick", { bubbles: true })
      );
      await fixture.whenStable();
      expect(query(".edit-mini-widget")).toBeTruthy();

      query(".cancel-button")?.click();
      await fixture.whenStable();
      expect(query(".edit-mini-widget")).toBeNull();
      expect(query(".test-body")).toBeTruthy();
    });

    it("Should not display the cancel button while the mini widget is loading", async () => {
      await createHost({ city: "Lyon" }, false);
      miniWidget.toEditMode();
      await fixture.whenStable();
      expect(query(".edit-mini-widget")).toBeTruthy();
      expect(query(".cancel-button")).toBeNull();
    });

    it("Should go back to read mode when the deletion is cancelled", async () => {
      await createHost({ city: "Lyon" });
      miniWidget.toDeleteMode();
      await fixture.whenStable();
      expect(query(".test-body")).toBeNull();
      query(".delete-mini-widget .cancel-button")?.click();
      await fixture.whenStable();
      expect(query(".test-body")).toBeTruthy();
    });
  });
});
