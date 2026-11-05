import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { Observable, of } from "rxjs";
import { Mock, vi } from "vitest";
import { environment } from "@environments/environment";
import { MiniWidgetTypeEnum } from "@enums/MiniWidgetTypeEnum";
import { ErrorHandlerService } from "@services/error-handler.service";
import { MiniWidgetService } from "@services/mini-widget.service";
import { MiniWidgetListComponent } from "./miniwidget-list.component";
import { provideHttpClient } from "@angular/common/http";
import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget.tokens";
import { WidgetTypePickerModalComponent } from "@modals/widget-type-picker-modal/widget-type-picker-modal.component";
import { MINI_WIDGET_TYPE_OPTIONS } from "@model/WidgetTypeOptions";

// Not imported from the weather widget spec, so that its tests are not run a second time
const weatherData = {
  weather: [{ id: 800, main: "Clear", description: "ciel dégagé", icon: "01d" }],
  main: { temp: 7.57 },
  timezone: 3600,
  name: "Paris"
};

describe("MiniWidgetListComponent", () => {
  let component: MiniWidgetListComponent;
  let httpTestingController: HttpTestingController;
  let dialogResult: string | undefined;

  const miniWidgetPath = environment.backend_url + "/miniWidget/";

  beforeEach(async () => {
    dialogResult = undefined;
    await TestBed.configureTestingModule({
      providers: [
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
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(MiniWidgetListComponent, "")
      .compileComponents();

    const fixture = TestBed.createComponent(MiniWidgetListComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  async function loadMiniWidgets(): Promise<void> {
    TestBed.tick();
    httpTestingController.expectOne(miniWidgetPath).flush([
      {
        id: 70,
        type: MiniWidgetTypeEnum.WEATHER,
        data: { city: "Paris" }
      }
    ]);
    await flushResources();
  }

  it("should have no widgets", async () => {
    await loadMiniWidgets();
    expect(component.miniWidgetList()).toHaveLength(1);
  });

  it("Should handle an error while loading the mini widgets", async () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    TestBed.tick();
    httpTestingController
      .expectOne(miniWidgetPath)
      .flush(null, { status: 500, statusText: "Server error" });
    await flushResources();
    expect(handleErrorSpy).toHaveBeenCalled();
    expect(component.miniWidgetList()).toEqual([]);
  });

  it("Should add a mini widget from the creation modal", async () => {
    await loadMiniWidgets();
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
    expect(component.miniWidgetList()).toEqual([]);
  });

  it("Should delete a mini widget", async () => {
    await loadMiniWidgets();
    TestBed.inject(MiniWidgetService).notifyMiniWidgetDeleted(70);
    httpTestingController.expectOne(miniWidgetPath + "deleteMiniWidget?widgetId=70").flush(null);
    expect(component.miniWidgetList()).toEqual([]);
  });

  it("Should provide the mini widget id and data to each mini widget", async () => {
    await loadMiniWidgets();
    const miniWidget = component.miniWidgetList()[0];
    const injector = component.getMiniWidgetInjector(miniWidget);
    expect(injector.get(WIDGET_ID)).toEqual(70);
    expect(injector.get(WIDGET_DATA)).toEqual({ city: "Paris" });
    expect(component.getMiniWidgetInjector(miniWidget)).toBe(injector);
  });
});

describe("MiniWidgetListComponent error cases", () => {
  let component: MiniWidgetListComponent;
  let httpTestingController: HttpTestingController;
  let handleErrorSpy: Mock;

  const miniWidgetPath = environment.backend_url + "/miniWidget/";

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: MatDialog,
          useValue: { open: () => ({ afterClosed: () => of("WEATHER") }) }
        }
      ]
    }).overrideTemplate(MiniWidgetListComponent, "");
    component = TestBed.createComponent(MiniWidgetListComponent).componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    handleErrorSpy = vi
      .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
      .mockImplementation(() => undefined);
    TestBed.tick();
    httpTestingController.expectOne(miniWidgetPath).flush([{ id: 70, type: 1 }]);
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("Should display an error when a mini widget can't be added", () => {
    component.openCreateMiniWidgetModal();
    httpTestingController
      .expectOne(miniWidgetPath + "addMiniWidget")
      .flush(null, { status: 500, statusText: "Server error" });
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.anything(),
      "Erreur lors de l'ajout d'un mini widget."
    );
    expect(component.miniWidgetList().map((miniWidget) => miniWidget.id)).toEqual([70]);
  });

  it("Should display an error and keep the mini widget when it can't be deleted", () => {
    TestBed.inject(MiniWidgetService).notifyMiniWidgetDeleted(70);
    httpTestingController
      .expectOne(miniWidgetPath + "deleteMiniWidget?widgetId=70")
      .flush(null, { status: 500, statusText: "Server error" });
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.anything(),
      "Erreur lors de la suppression du mini widget."
    );
    expect(component.miniWidgetList().map((miniWidget) => miniWidget.id)).toEqual([70]);
  });
});

describe("MiniWidgetListComponent template", () => {
  let fixture: ComponentFixture<MiniWidgetListComponent>;
  let component: MiniWidgetListComponent;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;
  let openSpy: Mock;

  const miniWidgetPath = environment.backend_url + "/miniWidget/";
  const weatherPath = environment.backend_url + "/weatherWidget/weather?city=";

  beforeEach(async () => {
    openSpy = vi.fn(() => ({ afterClosed: () => of("WEATHER") }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: { open: openSpy } }
      ]
    });
    fixture = TestBed.createComponent(MiniWidgetListComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    httpTestingController = TestBed.inject(HttpTestingController);
    TestBed.tick();
    httpTestingController
      .expectOne(miniWidgetPath)
      .flush([{ id: 70, type: MiniWidgetTypeEnum.WEATHER, data: { city: "Paris" } }]);
    await new Promise((resolve) => setTimeout(resolve));
    // Not whenStable: the pending request of the weather mini widget would keep the fixture unstable
    TestBed.tick();
    httpTestingController.expectOne(weatherPath + "Paris").flush(weatherData);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  function getMiniWidgets(): HTMLElement[] {
    return [...element.querySelectorAll<HTMLElement>(".miniwidget-container")];
  }

  it("Should display each mini widget with its saved configuration", () => {
    expect(getMiniWidgets()).toHaveLength(1);
    expect(
      getMiniWidgets()[0].querySelector("dash-weather-miniwidget .city-name")?.textContent
    ).toEqual("Paris");
    expect(element.querySelector("#add-mini-widget-button")).toBeTruthy();
  });

  it("Should add the mini widget chosen in the creation modal", async () => {
    element.querySelector<HTMLButtonElement>("#add-mini-widget-button")?.click();

    expect(openSpy).toHaveBeenCalledWith(WidgetTypePickerModalComponent, {
      width: "640px",
      data: { title: "Ajouter un mini widget", widgetTypes: MINI_WIDGET_TYPE_OPTIONS }
    });
    const request = httpTestingController.expectOne(miniWidgetPath + "addMiniWidget");
    expect(request.request.body).toEqual({ type: MiniWidgetTypeEnum.WEATHER });
    request.flush({ id: 71, type: MiniWidgetTypeEnum.WEATHER });
    await fixture.whenStable();

    expect(getMiniWidgets()).toHaveLength(2);
    // Created without configuration, the new mini widget is displayed in edit mode
    expect(getMiniWidgets()[1].querySelector(".edit-mini-widget")).toBeTruthy();
  });

  it("Should remove a deleted mini widget", async () => {
    getMiniWidgets()[0]
      .querySelector(".read-mini-widget-body-container")
      ?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await fixture.whenStable();
    [...element.querySelectorAll<HTMLButtonElement>(".edit-mini-widget button")].at(-1)?.click();
    await fixture.whenStable();
    element.querySelector<HTMLButtonElement>(".validate-deletion-button")?.click();

    httpTestingController.expectOne(miniWidgetPath + "deleteMiniWidget?widgetId=70").flush(null);
    await fixture.whenStable();
    expect(component.miniWidgetList()).toEqual([]);
    expect(getMiniWidgets()).toHaveLength(0);
  });
});
