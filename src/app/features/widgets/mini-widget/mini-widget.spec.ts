import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { Component, signal, Type } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { MiniWidgetService } from "@widgets/mini-widget-service";
import { WIDGET_ID } from "@widgets/widget-tokens";
import { MiniWidget } from "./mini-widget";

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

/** Mini widget which can't be configured. */
@Component({
  template: `
    <dash-mini-widget
      [widgetData]="widgetData()"
      [isFormValid]="isFormValid()"
      [isWidgetLoaded]="isWidgetLoaded()"
      (refreshWidgetAction)="refreshCount = refreshCount + 1"
    >
      <ng-template #body><div class="test-body">Body</div></ng-template>
    </dash-mini-widget>
  `,
  imports: [MiniWidget]
})
class MiniWidgetWithoutEditionHost extends MiniWidgetHost {}

describe("MiniWidget", () => {
  const miniWidgetId = 8;
  const updateUrl = `${environment.backend_url}/miniWidget/updateWidgetData/${miniWidgetId}`;
  let fixture: ComponentFixture<MiniWidgetHost>;
  let host: MiniWidgetHost;
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
    isWidgetLoaded = true,
    hostType: Type<MiniWidgetHost> = MiniWidgetHost
  ): Promise<void> {
    fixture = TestBed.createComponent(hostType);
    host = fixture.componentInstance;
    host.widgetData.set(widgetData);
    host.isWidgetLoaded.set(isWidgetLoaded);
    element = fixture.nativeElement;
    await fixture.whenStable();
  }

  function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return element.querySelector<T>(selector);
  }

  async function doubleClickBody(): Promise<void> {
    query(".read-mini-widget-body-container")?.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true })
    );
    await fixture.whenStable();
  }

  async function clickDeleteButton(): Promise<void> {
    [...element.querySelectorAll<HTMLButtonElement>(".edit-mini-widget button")].at(-1)?.click();
    await fixture.whenStable();
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

    it("Should save the mini widget data on validation, then display and refresh it", async () => {
      host.widgetData.set({ city: "Lyon" });
      await fixture.whenStable();
      const initialRefreshCount = host.refreshCount;
      query(".validate-button")?.click();
      const request = httpTestingController.expectOne(updateUrl);
      expect(request.request.method).toEqual("PATCH");
      expect(request.request.body).toEqual({ data: { city: "Lyon" } });
      request.flush({});
      await fixture.whenStable();

      expect(query(".read-mini-widget-body-container .test-body")).toBeTruthy();
      expect(query(".edit-mini-widget")).toBeNull();
      expect(host.refreshCount).toEqual(initialRefreshCount + 1);
    });

    it("Should display an error and stay in edit mode when the data can't be saved", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      const initialRefreshCount = host.refreshCount;
      query(".validate-button")?.click();
      httpTestingController
        .expectOne(updateUrl)
        .flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        "Erreur lors de la mise à jour de la configuration du widget."
      );
      expect(query(".edit-mini-widget")).toBeTruthy();
      expect(host.refreshCount).toEqual(initialRefreshCount);
    });

    it("Should ask a confirmation before deleting the mini widget", async () => {
      const deletedSpy = vi.fn();
      TestBed.inject(MiniWidgetService).miniWidgetDeleted.subscribe(deletedSpy);
      await clickDeleteButton();

      expect(query(".delete-mini-widget h4")?.textContent).toEqual(
        "Êtes-vous sûr de vouloir supprimer ce widget ?"
      );
      expect(query(".delete-mini-widget .cancel-button")?.textContent?.trim()).toEqual("Annuler");
      const validateDeletionButton = query(".delete-mini-widget .validate-deletion-button");
      expect(validateDeletionButton?.textContent?.trim()).toEqual("Supprimer");
      expect(query(".edit-mini-widget")).toBeNull();
      expect(deletedSpy).not.toHaveBeenCalled();

      validateDeletionButton?.click();
      expect(deletedSpy).toHaveBeenCalledWith(miniWidgetId);
    });

    it("Should go back to edit mode when the deletion of a mini widget without data is cancelled", async () => {
      await clickDeleteButton();
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

    it("Should not refresh a mini widget with an invalid form on initialization", async () => {
      fixture = TestBed.createComponent(MiniWidgetHost);
      host = fixture.componentInstance;
      host.isFormValid.set(false);
      await fixture.whenStable();
      expect(host.refreshCount).toEqual(0);
    });

    it("Should display a spinner while the mini widget is loading", async () => {
      await createHost({ city: "Lyon" }, false);
      expect(query(".loading-spinner mat-spinner")).toBeTruthy();
      expect(query(".test-body")).toBeNull();
    });

    it("Should edit the mini widget on double click, then cancel the edition", async () => {
      await createHost({ city: "Lyon" });
      await doubleClickBody();
      expect(query(".edit-mini-widget .test-edit-component")).toBeTruthy();

      query(".cancel-button")?.click();
      await fixture.whenStable();
      expect(query(".edit-mini-widget")).toBeNull();
      expect(query(".test-body")).toBeTruthy();
    });

    it("Should not display the cancel button while the mini widget is loading", async () => {
      await createHost({ city: "Lyon" }, false);
      await doubleClickBody();
      expect(query(".edit-mini-widget")).toBeTruthy();
      expect(query(".cancel-button")).toBeNull();
    });

    it("Should go back to read mode when the deletion is cancelled", async () => {
      await createHost({ city: "Lyon" });
      await doubleClickBody();
      await clickDeleteButton();
      expect(query(".delete-mini-widget")).toBeTruthy();
      expect(query(".test-body")).toBeNull();
      query(".delete-mini-widget .cancel-button")?.click();
      await fixture.whenStable();
      expect(query(".delete-mini-widget")).toBeNull();
      expect(query(".test-body")).toBeTruthy();
    });
  });

  describe("Without edit component", () => {
    it("Should not edit the mini widget on double click", async () => {
      await createHost({ city: "Lyon" }, true, MiniWidgetWithoutEditionHost);
      await doubleClickBody();
      expect(query(".edit-mini-widget")).toBeNull();
      expect(query(".test-body")).toBeTruthy();
    });

    it("Should only display the actions of a mini widget without data", async () => {
      await createHost(undefined, true, MiniWidgetWithoutEditionHost);
      expect(query(".edit-mini-widget .validate-button")).toBeTruthy();
      expect(query(".edit-mini-widget input")).toBeNull();
    });
  });
});
