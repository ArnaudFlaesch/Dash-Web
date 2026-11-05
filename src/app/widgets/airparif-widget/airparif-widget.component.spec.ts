import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget.tokens";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@services/error-handler.service";
import { WidgetService } from "@services/widget.service";
import { AirParifWidgetComponent } from "./airparif-widget.component";
import { AirParifWidgetService } from "./airparif-widget.service";
import { AirParifIndiceEnum } from "./model/IAirParif";

describe("AirParifWidgetComponent", () => {
  let component: AirParifWidgetComponent;
  let httpTestingController: HttpTestingController;

  const communeInseeCode = "75112";
  const airParifToken = "AIRPARIFTOKEN";

  const couleursIndicesData = [
    {
      name: "BON",
      color: "#50f0e6"
    },
    {
      name: "MOYEN",
      color: "#50ccaa"
    },
    {
      name: "DEGRADE",
      color: "#f0e641"
    },
    {
      name: "MAUVAIS",
      color: "#ff5050"
    },
    {
      name: "TRES_MAUVAIS",
      color: "#960032"
    },
    {
      name: "EXTREMEMENT_MAUVAIS",
      color: "#7d2181"
    }
  ];

  const forecastData = [
    {
      date: "2022-10-08",
      no2: "MOYEN",
      o3: "BON",
      pm10: "BON",
      pm25: "BON",
      so2: "BON",
      indice: "MOYEN"
    },
    {
      date: "2022-10-09",
      no2: "MOYEN",
      o3: "MOYEN",
      pm10: "BON",
      pm25: "MOYEN",
      so2: "BON",
      indice: "MOYEN"
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AirParifWidgetService,
        ErrorHandlerService,
        WidgetService,
        { provide: WIDGET_ID, useValue: 1 }
      ]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(AirParifWidgetComponent, "")
      .compileComponents();

    const fixture = TestBed.createComponent(AirParifWidgetComponent);
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

  it("Should create an AirParif Widget", async () => {
    expect(component.config().airParifApiKey).toEqual("");
    expect(component.config().communeInseeCode).toEqual("");
    expect(component.isFormValid()).toEqual(false);
    expect(component.widgetData()).toBeUndefined();
    component.config.update((config) => ({ ...config, airParifApiKey: airParifToken }));
    component.config.update((config) => ({ ...config, communeInseeCode: communeInseeCode }));
    expect(component.isFormValid()).toEqual(true);
    const widgetData = component.widgetData();
    expect(widgetData?.airParifApiKey).toBe(airParifToken);
    expect(widgetData?.communeInseeCode).toBe(communeInseeCode);
    expect(component.airParifForecast()).toEqual([]);
    expect(component.airParifCouleursIndices()).toEqual([]);

    component.refreshWidget();
    TestBed.tick();

    const requests = httpTestingController.match({
      method: "GET"
    });
    requests[0].flush(forecastData);
    await flushResources();
    requests[1].flush(couleursIndicesData);
    await flushResources();

    expect(component.airParifForecast()).toEqual(forecastData);
    expect(component.airParifCouleursIndices()).toEqual(couleursIndicesData);
  });

  it("Should validate the commune INSEE code", () => {
    component.config.update((config) => ({ ...config, airParifApiKey: airParifToken }));
    component.config.update((config) => ({ ...config, communeInseeCode: "2A004" }));
    expect(component.isFormValid()).toEqual(true);
    component.config.update((config) => ({ ...config, communeInseeCode: "Paris" }));
    expect(component.isFormValid()).toEqual(false);
    component.config.update((config) => ({ ...config, communeInseeCode: "751120" }));
    expect(component.isFormValid()).toEqual(false);
  });

  it("Should give the class and the label of an indice", () => {
    expect(component.getIndiceClass("TRES_MAUVAIS" as AirParifIndiceEnum)).toEqual(
      "indice-tres-mauvais"
    );
    expect(component.getIndiceLabel("TRES_MAUVAIS" as AirParifIndiceEnum)).toEqual("Très mauvais");
    // Not rendered, so there is no map to open
    expect(() => component.openSidebar()).not.toThrow();
  });

  it("Should get errors from API", async () => {
    component.config.update((config) => ({ ...config, airParifApiKey: airParifToken }));
    component.config.update((config) => ({ ...config, communeInseeCode: communeInseeCode }));
    expect(component.airParifForecast()).toEqual([]);
    expect(component.airParifCouleursIndices()).toEqual([]);
    component.refreshWidget();
    TestBed.tick();

    const requests = httpTestingController.match({
      method: "GET"
    });
    requests[0].error(new ProgressEvent("Server error"));
    await flushResources();

    expect(component.airParifForecast()).toEqual([]);
    expect(component.airParifCouleursIndices()).toEqual([]);
  });

  it("Should not load the forecast with an invalid configuration", () => {
    component.config.update((config) => ({ ...config, airParifApiKey: airParifToken }));
    component.refreshWidget();
    TestBed.tick();
    expect(httpTestingController.match(() => true)).toHaveLength(0);
    expect(component.airParifForecast()).toEqual([]);
  });
});

describe("AirParifWidgetComponent rendering", () => {
  const widgetData = { airParifApiKey: "AIRPARIFTOKEN", communeInseeCode: "75112" };
  const forecastUrl = `${environment.backend_url}/airParifWidget/previsionCommune?commune=75112`;
  const couleursUrl = `${environment.backend_url}/airParifWidget/couleurs`;
  const forecast = [
    {
      date: "2022-10-08",
      no2: "MOYEN",
      o3: "BON",
      pm10: "BON",
      pm25: "BON",
      so2: "BON",
      indice: "TRES_MAUVAIS"
    }
  ];

  let fixture: ComponentFixture<AirParifWidgetComponent>;
  let component: AirParifWidgetComponent;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  beforeAll(() => {
    if (!window.ResizeObserver) {
      window.ResizeObserver = class ResizeObserver {
        public observe = vi.fn();
        public unobserve = vi.fn();
        public disconnect = vi.fn();
      };
    }
  });

  async function createWidget(data?: Record<string, unknown>): Promise<void> {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: 1 },
        ...(data ? [{ provide: WIDGET_DATA, useValue: data }] : [])
      ]
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AirParifWidgetComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    TestBed.tick();
  }

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  it("should display the configuration form without saved configuration", async () => {
    await createWidget();
    await fixture.whenStable();

    expect(element.querySelector("#airparif-api-key-label")?.textContent).toContain(
      component.labels.apiKey
    );
    expect((element.querySelector("#airparif-api-key") as HTMLInputElement).placeholder).toEqual(
      component.labels.apiKeyPlaceholder
    );
    expect(element.querySelector("#commune-insee-code-label")?.textContent).toContain(
      component.labels.communeCode
    );
    expect(element.querySelector("mat-hint")?.textContent).toContain(
      component.labels.communeCodeHint
    );
    expect(element.querySelector("dash-airparif-map")).toBeNull();
    httpTestingController.expectNone(() => true);

    for (const [id, value] of [
      ["#airparif-api-key", "AIRPARIFTOKEN"],
      ["#commune-insee-code", "75112"]
    ]) {
      const input = element.querySelector(id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event("input"));
    }
    await fixture.whenStable();
    expect(component.widgetData()).toEqual(widgetData);
  });

  it("should display the forecast of the commune", async () => {
    await createWidget(widgetData);
    // Loading
    expect(element.querySelector("#map-loading")).not.toBeNull();
    expect(element.querySelector("#airparif-today-chip")).toBeNull();
    const titleLink = element.querySelector(".widget-header a") as HTMLAnchorElement;
    expect(titleLink.getAttribute("href")).toEqual(component.airParifWebsiteUrl);
    expect(titleLink.textContent).toContain(component.labels.title);

    httpTestingController.expectOne(forecastUrl).flush(forecast);
    httpTestingController
      .expectOne(couleursUrl)
      .flush([{ name: "TRES_MAUVAIS", color: "#960032" }]);
    await flushResources();
    await fixture.whenStable();

    expect(element.querySelector("#map-loading")).toBeNull();
    const todayChip = element.querySelector("#airparif-today-chip") as HTMLButtonElement;
    expect(todayChip.textContent).toContain("Très mauvais");
    expect(element.querySelector("#airparif-today-dot")?.className).toEqual("indice-tres-mauvais");
    expect(element.querySelector("#global-indice-value")?.textContent).toContain("Très mauvais");

    // The chip opens the sidebar of the map, with the details of the forecast
    const sidebar = element.querySelector("#sidebar") as HTMLElement;
    expect(sidebar.classList).toContain("collapsed");
    todayChip.click();
    expect(sidebar.classList).not.toContain("collapsed");
  });

  it("should display an empty map when the forecast cannot be loaded", async () => {
    await createWidget(widgetData);
    const handleErrorSpy = vi
      .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
      .mockImplementation(() => undefined);

    httpTestingController
      .expectOne(forecastUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    // The request of the colors is cancelled with the forecast one
    expect(httpTestingController.expectOne(couleursUrl).cancelled).toBe(true);
    await flushResources();
    await fixture.whenStable();

    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des prévisions d'AirParif."
    );
    expect(element.querySelector("#airparif-today-chip")).toBeNull();
    expect(element.querySelector("#forecast-empty")).not.toBeNull();
  });
});
