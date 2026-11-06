import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { WidgetService } from "@widgets/widget-service";
import { WIDGET_ID } from "@widgets/widget-tokens";
import { Widget } from "./widget";

@Component({
  template: `
    <dash-widget
      [widgetData]="widgetData()"
      [isFormValid]="isFormValid()"
      [isWidgetLoaded]="isWidgetLoaded()"
      (refreshWidgetAction)="refreshCount = refreshCount + 1"
    >
      <ng-template #headerIcon><span class="test-header-icon">icon</span></ng-template>
      <ng-template #headerTitle><span class="test-header-title">Title</span></ng-template>
      <ng-template #editComponent><input class="test-edit-component" /></ng-template>
      <ng-template #additionalActions
        ><button class="test-additional-action">Action</button></ng-template
      >
      <ng-template #body><div class="test-body">Body</div></ng-template>
    </dash-widget>
  `,
  imports: [Widget]
})
class WidgetHost {
  public readonly widgetData = signal<Record<string, unknown> | undefined>({ city: "Paris" });
  public readonly isFormValid = signal(true);
  public readonly isWidgetLoaded = signal(true);
  public refreshCount = 0;
}

@Component({
  template: `
    <dash-widget [widgetData]="{}" [isWidgetLoaded]="true">
      <ng-template #headerIcon><span>icon</span></ng-template>
      <ng-template #headerTitle><span>Title</span></ng-template>
      <ng-template #body><div class="test-body">Body</div></ng-template>
    </dash-widget>
  `,
  imports: [Widget]
})
class ReadOnlyWidgetHost {}

describe("Widget", () => {
  const widgetId = 5;
  let fixture: ComponentFixture<WidgetHost>;
  let host: WidgetHost;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: widgetId }
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
    fixture = TestBed.createComponent(WidgetHost);
    host = fixture.componentInstance;
    host.widgetData.set(widgetData);
    host.isWidgetLoaded.set(isWidgetLoaded);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return element.querySelector<T>(selector);
  }

  describe("Edit mode", () => {
    beforeEach(async () => {
      await createHost(undefined);
    });

    it("Should display the edit component without the cancel button", () => {
      expect(query(".widget-edit-mode .widget-header")?.textContent?.trim()).toContain(
        "Configuration du widget"
      );
      expect(query(".test-edit-component")).toBeTruthy();
      expect(query(".validate-button")?.textContent).toContain("Valider");
      expect(query(".cancel-button")).toBeNull();
      expect(query(".widget-read-mode")).toBeNull();
    });

    it("Should only allow the validation of a valid form", async () => {
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(false);
      host.isFormValid.set(false);
      await fixture.whenStable();
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
    });

    it("Should save the widget data on validation", async () => {
      host.widgetData.set({ city: "Lyon" });
      await fixture.whenStable();
      const initialRefreshCount = host.refreshCount;
      query(".validate-button")?.click();
      const request = httpTestingController.expectOne(
        `${environment.backend_url}/widget/updateWidgetData/${widgetId}`
      );
      expect(request.request.method).toEqual("PATCH");
      expect(request.request.body).toEqual({ data: { city: "Lyon" } });
      request.flush({});
      await fixture.whenStable();

      expect(query(".widget-read-mode")).toBeTruthy();
      expect(host.refreshCount).toEqual(initialRefreshCount + 1);
    });

    it("Should display an error and stay in edit mode when the data can't be saved", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      query(".validate-button")?.click();
      httpTestingController
        .expectOne(`${environment.backend_url}/widget/updateWidgetData/${widgetId}`)
        .flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        "Erreur lors de la mise à jour de la configuration du widget."
      );
      expect(query(".widget-edit-mode")).toBeTruthy();
    });

    it("Should go to delete mode, then back to edit mode while the widget has no data", async () => {
      query(".delete-button")?.click();
      await fixture.whenStable();
      expect(query("dash-delete-widget")).toBeTruthy();
      expect(query(".widget-edit-mode")).toBeNull();

      query("dash-delete-widget .cancel-button")?.click();
      await fixture.whenStable();
      expect(query("dash-delete-widget")).toBeNull();
      expect(query(".widget-edit-mode")).toBeTruthy();
    });

    it("Should notify the widget deletion", async () => {
      const deletedSpy = vi.fn();
      TestBed.inject(WidgetService).widgetDeleted.subscribe(deletedSpy);
      query(".delete-button")?.click();
      await fixture.whenStable();
      query("dash-delete-widget .validate-deletion-button")?.click();
      expect(deletedSpy).toHaveBeenCalledWith(widgetId);
    });
  });

  describe("Read mode", () => {
    it("Should display the header, the actions and the body of a loaded widget", async () => {
      await createHost({ city: "Paris" });
      expect(query(".widget-read-mode")).toBeTruthy();
      expect(query(".widget-edit-mode")).toBeNull();
      expect(query(".widget-header .test-header-icon")).toBeTruthy();
      expect(query(".widget-header .test-header-title")?.textContent).toEqual("Title");
      expect(query(".header-actions .test-additional-action")).toBeTruthy();
      expect(query(".refresh-button")).toBeTruthy();
      expect(query(".edit-button")).toBeTruthy();
      expect(query(".test-body")).toBeTruthy();
      expect(query("mat-spinner")).toBeNull();
      // Refreshed once on initialization, as the form is valid
      expect(host.refreshCount).toEqual(1);
    });

    it("Should display a spinner while the widget is loading", async () => {
      await createHost({ city: "Paris" }, false);
      expect(query(".loading-spinner mat-spinner")).toBeTruthy();
      expect(query(".test-body")).toBeNull();

      host.isWidgetLoaded.set(true);
      await fixture.whenStable();
      expect(query(".loading-spinner")).toBeNull();
      expect(query(".test-body")).toBeTruthy();
    });

    it("Should refresh the widget", async () => {
      await createHost({ city: "Paris" });
      query(".refresh-button")?.click();
      expect(host.refreshCount).toEqual(2);
    });

    it("Should not refresh a widget with an invalid form", async () => {
      await createHost({ city: "Paris" });
      host.isFormValid.set(false);
      await fixture.whenStable();
      query(".refresh-button")?.click();
      expect(host.refreshCount).toEqual(1);
    });

    it("Should edit the widget, then cancel the edition", async () => {
      await createHost({ city: "Paris" });
      query(".edit-button")?.click();
      await fixture.whenStable();
      expect(query(".widget-edit-mode")).toBeTruthy();
      expect(query(".cancel-button")?.textContent?.trim()).toEqual("Annuler");

      query(".cancel-button")?.click();
      await fixture.whenStable();
      expect(query(".widget-read-mode")).toBeTruthy();
      expect(query(".widget-edit-mode")).toBeNull();
    });

    it("Should not display the cancel button while the widget is loading", async () => {
      await createHost({ city: "Paris" }, false);
      query(".edit-button")?.click();
      await fixture.whenStable();
      expect(query(".widget-edit-mode")).toBeTruthy();
      expect(query(".cancel-button")).toBeNull();
    });

    it("Should go back to read mode when the deletion is cancelled", async () => {
      await createHost({ city: "Paris" });
      query(".edit-button")?.click();
      await fixture.whenStable();
      query(".delete-button")?.click();
      await fixture.whenStable();
      expect(query("dash-delete-widget")).toBeTruthy();
      expect(query(".widget-edit-mode")).toBeNull();
      expect(query(".widget-read-mode")).toBeNull();
      query("dash-delete-widget .cancel-button")?.click();
      await fixture.whenStable();
      expect(query(".widget-read-mode")).toBeTruthy();
    });
  });

  it("Should not display the edit and additional actions of a widget without them", async () => {
    const readOnlyFixture = TestBed.createComponent(ReadOnlyWidgetHost);
    await readOnlyFixture.whenStable();
    const readOnlyElement: HTMLElement = readOnlyFixture.nativeElement;

    expect(readOnlyElement.querySelector(".widget-read-mode")).toBeTruthy();
    expect(readOnlyElement.querySelector(".test-body")).toBeTruthy();
    expect(readOnlyElement.querySelector(".refresh-button")).toBeTruthy();
    expect(readOnlyElement.querySelector(".edit-button")).toBeNull();
    expect(readOnlyElement.querySelectorAll(".header-actions > span")).toHaveLength(0);
  });
});
