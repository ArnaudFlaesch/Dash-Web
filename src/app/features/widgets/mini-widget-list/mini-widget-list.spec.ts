import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { Mock, vi } from "vitest";
import { environment } from "@environments/environment";
import { MiniWidgetType } from "@widgets/mini-widget-type";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { MiniWidgetList } from "./mini-widget-list";
import { provideHttpClient } from "@angular/common/http";
import { WidgetTypePickerModal } from "@widgets/widget-type-picker-modal/widget-type-picker-modal";
import { MINI_WIDGET_TYPE_OPTIONS } from "@widgets/widget-type-picker-modal/widget-type-options";
import { weatherData } from "@widgets/weather-widget/weather-widget-fixtures";
import { MiniWidgetConfig } from "@widgets/mini-widget-config";

describe("MiniWidgetList", () => {
  const miniWidgetPath = environment.backend_url + "/mini-widgets";
  // Getting and adding the mini widgets share the same url
  const getMiniWidgetsRequest = { method: "GET", url: miniWidgetPath };
  const addMiniWidgetRequest = { method: "POST", url: miniWidgetPath };
  const weatherPath = environment.backend_url + "/weather/current?city=";
  let fixture: ComponentFixture<MiniWidgetList>;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;
  let openSpy: Mock;
  let dialogResult: string | undefined;
  let handleErrorSpy: Mock;

  beforeEach(() => {
    dialogResult = "WEATHER";
    openSpy = vi.fn(() => ({ afterClosed: () => of(dialogResult) }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: { open: openSpy } }
      ]
    });
    handleErrorSpy = vi
      .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
      .mockImplementation(() => undefined);
    fixture = TestBed.createComponent(MiniWidgetList);
    element = fixture.nativeElement as HTMLElement;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    // Not whenStable: the pending request of a weather mini widget would keep the fixture unstable
    TestBed.tick();
  }

  async function loadMiniWidgets(miniWidgets: Partial<MiniWidgetConfig>[]): Promise<void> {
    TestBed.tick();
    httpTestingController.expectOne(getMiniWidgetsRequest).flush(miniWidgets);
    await flushResources();
  }

  function getMiniWidgets(): HTMLElement[] {
    return [...element.querySelectorAll<HTMLElement>(".mini-widget-container")];
  }

  async function clickAddButton(): Promise<void> {
    element.querySelector<HTMLButtonElement>("#add-mini-widget-button")?.click();
    await fixture.whenStable();
  }

  /** Deletes the first mini widget, which must be in edit mode. */
  async function deleteFirstMiniWidget(): Promise<void> {
    [...getMiniWidgets()[0].querySelectorAll<HTMLButtonElement>(".edit-mini-widget button")]
      .at(-1)
      ?.click();
    await fixture.whenStable();
    getMiniWidgets()[0].querySelector<HTMLButtonElement>(".validate-deletion-button")?.click();
  }

  describe("With a configured mini widget", () => {
    beforeEach(async () => {
      await loadMiniWidgets([{ id: 70, type: MiniWidgetType.WEATHER, data: { city: "Paris" } }]);
      httpTestingController.expectOne(weatherPath + "Paris").flush(weatherData);
      await fixture.whenStable();
    });

    it("Should display each mini widget with its saved configuration", () => {
      expect(getMiniWidgets()).toHaveLength(1);
      expect(
        getMiniWidgets()[0].querySelector("dash-weather-mini-widget .city-name")?.textContent
      ).toEqual("Paris");
      expect(element.querySelector("#add-mini-widget-button")).toBeTruthy();
    });

    it("Should provide its id to each mini widget", async () => {
      getMiniWidgets()[0]
        .querySelector(".read-mini-widget-body-container")
        ?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      await fixture.whenStable();
      getMiniWidgets()[0].querySelector<HTMLButtonElement>(".validate-button")?.click();

      const request = httpTestingController.expectOne(miniWidgetPath + "/70");
      expect(request.request.body).toEqual({ data: { city: "Paris" } });
      request.flush({});
      TestBed.tick();
      httpTestingController.expectOne(weatherPath + "Paris").flush(weatherData);
      await fixture.whenStable();
    });

    it("Should add the mini widget chosen in the creation modal", async () => {
      const firstMiniWidget = getMiniWidgets()[0].querySelector("dash-weather-mini-widget");
      await clickAddButton();

      expect(openSpy).toHaveBeenCalledWith(WidgetTypePickerModal, {
        width: "640px",
        data: { title: "Ajouter un mini widget", widgetTypes: MINI_WIDGET_TYPE_OPTIONS }
      });
      const request = httpTestingController.expectOne(addMiniWidgetRequest);
      expect(request.request.body).toEqual({ type: MiniWidgetType.WEATHER });
      request.flush({ id: 71, type: MiniWidgetType.WEATHER });
      await fixture.whenStable();

      expect(getMiniWidgets()).toHaveLength(2);
      // Created without configuration, the new mini widget is displayed in edit mode
      expect(getMiniWidgets()[1].querySelector(".edit-mini-widget")).toBeTruthy();
      // The existing mini widget is not recreated, so its weather is not loaded again
      expect(getMiniWidgets()[0].querySelector("dash-weather-mini-widget")).toBe(firstMiniWidget);
      expect(firstMiniWidget?.querySelector(".city-name")?.textContent).toEqual("Paris");
    });

    it("Should not add a mini widget when the modal is closed", async () => {
      dialogResult = undefined;
      await clickAddButton();
      httpTestingController.expectNone(addMiniWidgetRequest);
      expect(getMiniWidgets()).toHaveLength(1);
    });

    it("Should remove a deleted mini widget", async () => {
      getMiniWidgets()[0]
        .querySelector(".read-mini-widget-body-container")
        ?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
      await fixture.whenStable();
      await deleteFirstMiniWidget();

      httpTestingController.expectOne(miniWidgetPath + "/70").flush(null);
      await fixture.whenStable();
      expect(getMiniWidgets()).toHaveLength(0);
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe("Error cases", () => {
    it("Should display an error when the mini widgets can't be loaded", async () => {
      TestBed.tick();
      httpTestingController
        .expectOne(getMiniWidgetsRequest)
        .flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        "Erreur lors de la récupération des mini widgets."
      );
      expect(getMiniWidgets()).toHaveLength(0);
      expect(element.querySelector("#add-mini-widget-button")).toBeTruthy();
    });

    describe("With a mini widget to configure", () => {
      beforeEach(async () => {
        // Without configuration, the mini widget is displayed in edit mode and loads nothing
        await loadMiniWidgets([{ id: 70, type: MiniWidgetType.WEATHER }]);
        await fixture.whenStable();
      });

      it("Should display an error when a mini widget can't be added", async () => {
        await clickAddButton();
        httpTestingController
          .expectOne(addMiniWidgetRequest)
          .flush(null, { status: 500, statusText: "Server error" });
        await fixture.whenStable();

        expect(handleErrorSpy).toHaveBeenCalledWith(
          expect.anything(),
          "Erreur lors de l'ajout d'un mini widget."
        );
        expect(getMiniWidgets()).toHaveLength(1);
      });

      it("Should display an error and keep the mini widget when it can't be deleted", async () => {
        await deleteFirstMiniWidget();
        httpTestingController
          .expectOne(miniWidgetPath + "/70")
          .flush(null, { status: 500, statusText: "Server error" });
        await fixture.whenStable();

        expect(handleErrorSpy).toHaveBeenCalledWith(
          expect.anything(),
          "Erreur lors de la suppression du mini widget."
        );
        expect(getMiniWidgets()).toHaveLength(1);
      });
    });
  });
});
