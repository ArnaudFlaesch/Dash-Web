import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget-tokens";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { Component, input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { Widget } from "@widgets/widget/widget";
import { AirparifWidget } from "./airparif-widget";
import { AirparifWidgetService } from "./airparif-widget-service";
import { AirparifMap } from "./airparif-map/airparif-map";

/** Map without OpenLayers, to display the widget without the Airparif map. */
@Component({ selector: "dash-airparif-map", template: "" })
class AirparifMapStub {
  public readonly airParifApiKey = input<string>();
  public readonly airParifForecast = input<unknown[]>();
  public readonly airParifCouleursIndices = input<unknown[]>();
  public readonly isLoading = input(false);
}

describe("AirparifWidget", () => {
  const widgetData = { airParifApiKey: "AIRPARIFTOKEN", communeInseeCode: "75112" };
  const forecastUrl = `${environment.backend_url}/airParifWidget/previsionCommune?commune=75112`;
  const couleursUrl = `${environment.backend_url}/airParifWidget/couleurs`;
  const updateWidgetDataUrl = `${environment.backend_url}/widget/updateWidgetData/1`;

  const couleursIndicesData = [
    { name: "BON", color: "#50f0e6" },
    { name: "MOYEN", color: "#50ccaa" },
    { name: "DEGRADE", color: "#f0e641" },
    { name: "MAUVAIS", color: "#ff5050" },
    { name: "TRES_MAUVAIS", color: "#960032" },
    { name: "EXTREMEMENT_MAUVAIS", color: "#7d2181" }
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

  let fixture: ComponentFixture<AirparifWidget>;
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

  /** Creates the widget with its saved configuration, which loads the forecast if it is valid. */
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
    fixture = TestBed.createComponent(AirparifWidget);
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

  async function typeInInput(selector: string, value: string): Promise<void> {
    const input = element.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
  }

  function getValidateButton(): HTMLButtonElement {
    return element.querySelector(".validate-button") as HTMLButtonElement;
  }

  /** Answers the requests of the forecast and of the colors of the indices. */
  async function flushForecast(
    forecast: unknown[] = forecastData,
    couleurs: unknown[] = couleursIndicesData
  ): Promise<void> {
    httpTestingController.expectOne(forecastUrl).flush(forecast);
    httpTestingController.expectOne(couleursUrl).flush(couleurs);
    await flushResources();
    await fixture.whenStable();
  }

  it("should display the configuration form without saved configuration", async () => {
    await createWidget();
    await fixture.whenStable();

    expect(element.querySelector("#airparif-api-key-label")?.textContent).toContain("Clé d'API");
    expect((element.querySelector("#airparif-api-key") as HTMLInputElement).placeholder).toEqual(
      "Saisissez la clé d'API Airparif"
    );
    expect(element.querySelector("#commune-insee-code-label")?.textContent).toContain(
      "Code commune"
    );
    expect((element.querySelector("#commune-insee-code") as HTMLInputElement).placeholder).toEqual(
      "Saisissez le code commune"
    );
    expect(element.querySelector("mat-hint")?.textContent).toContain(
      "Code INSEE à 5 chiffres, par exemple 75112 pour Paris 12e"
    );
    expect(element.querySelector("dash-airparif-map")).toBeNull();
    expect(getValidateButton().disabled).toBe(true);
    httpTestingController.expectNone(() => true);
  });

  it("should save the configuration, then load the forecast of the commune", async () => {
    await createWidget();
    await typeInInput("#airparif-api-key", "AIRPARIFTOKEN");
    expect(getValidateButton().disabled).toBe(true);
    await typeInInput("#commune-insee-code", "75112");
    expect(getValidateButton().disabled).toBe(false);

    getValidateButton().click();
    const updateRequest = httpTestingController.expectOne(updateWidgetDataUrl);
    expect(updateRequest.request.body).toEqual({ data: widgetData });
    updateRequest.flush({});
    TestBed.tick();

    await flushForecast();
    expect(element.querySelector("#airparif-today-chip")?.textContent).toContain("Moyen");
    expect(element.querySelector("#global-indice-value")?.textContent).toContain("Moyen");
    expect(element.querySelectorAll("#indices-legend .indice-label")).toHaveLength(6);
  });

  it("should validate the commune INSEE code", async () => {
    await createWidget();
    await typeInInput("#airparif-api-key", "AIRPARIFTOKEN");

    // The second character is A or B for Corsica
    for (const [communeInseeCode, isValid] of [
      ["2A004", true],
      ["Paris", false],
      ["751120", false],
      ["75112", true]
    ] as const) {
      await typeInInput("#commune-insee-code", communeInseeCode);
      expect(getValidateButton().disabled, communeInseeCode).toBe(!isValid);
    }
  });

  it("should not load the forecast with an invalid configuration", async () => {
    await createWidget({ airParifApiKey: "AIRPARIFTOKEN" });
    await fixture.whenStable();

    // Still in edit mode, so that the configuration is completed
    expect(element.querySelector("#commune-insee-code")).not.toBeNull();
    expect(element.querySelector("dash-airparif-map")).toBeNull();

    fixture.debugElement.query(By.directive(Widget)).componentInstance.refreshWidgetAction.emit();
    TestBed.tick();
    httpTestingController.expectNone(() => true);
  });

  it("should display the forecast of the commune", async () => {
    await createWidget(widgetData);
    // Loading
    expect(element.querySelector("#map-loading")).not.toBeNull();
    expect(element.querySelector("#airparif-today-chip")).toBeNull();
    const titleLink = element.querySelector(".widget-header a") as HTMLAnchorElement;
    expect(titleLink.getAttribute("href")).toEqual(
      TestBed.inject(AirparifWidgetService).AIRPARIF_WEBSITE_URL
    );
    expect(titleLink.textContent).toContain("Airparif");

    await flushForecast(
      [{ ...forecastData[0], indice: "TRES_MAUVAIS" }],
      [{ name: "TRES_MAUVAIS", color: "#960032" }]
    );

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

  it("should reload the forecast of the same commune on refresh", async () => {
    await createWidget(widgetData);
    await flushForecast();

    (element.querySelector(".refresh-button") as HTMLButtonElement).click();
    TestBed.tick();
    await flushForecast([{ ...forecastData[0], indice: "BON" }]);

    expect(element.querySelector("#airparif-today-chip")?.textContent).toContain("Bon");
  });

  it("should not fail to open the sidebar without map", async () => {
    TestBed.overrideComponent(AirparifWidget, {
      remove: { imports: [AirparifMap] },
      add: { imports: [AirparifMapStub] }
    });
    await createWidget(widgetData);
    await flushForecast();

    const todayChip = element.querySelector("#airparif-today-chip") as HTMLButtonElement;
    expect(() => todayChip.click()).not.toThrow();
    expect(element.querySelector("#sidebar")).toBeNull();
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
      "Erreur lors de la récupération des prévisions d'Airparif."
    );
    expect(element.querySelector("#airparif-today-chip")).toBeNull();
    expect(element.querySelector("#forecast-empty")).not.toBeNull();
  });
});
