import { ComponentFixture, TestBed } from "@angular/core/testing";
import OlMap from "ol/Map";
import TileLayer from "ol/layer/Tile";
import { get as getProjection } from "ol/proj";
import TileWMS from "ol/source/TileWMS";
import { AirparifCouleur, AirparifForecast } from "../airparif";
import { AirparifWidgetService } from "../airparif-widget-service";
import { AirparifMap } from "./airparif-map";

describe("AirparifMap", () => {
  let component: AirparifMap;
  let fixture: ComponentFixture<AirparifMap>;

  beforeAll(() => {
    if (typeof window !== "undefined" && !window.ResizeObserver) {
      window.ResizeObserver = class ResizeObserver {
        public observe = vi.fn();
        public unobserve = vi.fn();
        public disconnect = vi.fn();
      };
    }
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AirparifMap);
    component = fixture.componentInstance;
  });

  it("Should create an Airparif map", async () => {
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
    ] as unknown as AirparifCouleur[];

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
    ] as unknown as AirparifForecast[];

    fixture.componentRef.setInput("airParifForecast", forecastData);
    fixture.componentRef.setInput("airParifCouleursIndices", couleursIndicesData);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    // Class and label of each indice of the legend
    const legend = Array.from(element.querySelectorAll("#indices-legend .indice-label")).map(
      (indice) => ({
        class: indice.querySelector(".indice-dot")?.className,
        label: indice.textContent?.trim()
      })
    );
    expect(legend).toEqual([
      { class: "indice-dot indice-bon", label: "Bon" },
      { class: "indice-dot indice-moyen", label: "Moyen" },
      { class: "indice-dot indice-degrade", label: "Dégradé" },
      { class: "indice-dot indice-mauvais", label: "Mauvais" },
      { class: "indice-dot indice-tres-mauvais", label: "Très mauvais" },
      { class: "indice-dot indice-extremement-mauvais", label: "Extrêmement mauvais" }
    ]);
    expect(element.querySelector("#global-indice")?.className).toContain("indice-soft-moyen");
    expect(element.querySelector("#global-indice-color mat-icon")?.textContent).toContain(
      "sentiment_satisfied"
    );

    const [todayButton, tomorrowButton] = Array.from(
      element.querySelectorAll<HTMLButtonElement>(".forecast-select-button")
    );
    expect(todayButton.classList).toContain("active");
    tomorrowButton.click();
    await fixture.whenStable();
    expect(tomorrowButton.classList).toContain("active");
    todayButton.click();
    await fixture.whenStable();
    expect(todayButton.classList).toContain("active");
    expect(element.querySelector(".airparif-indice .indice-badge")?.textContent).toContain("Moyen");
  });

  it("Should display an empty state without forecast", async () => {
    fixture.componentRef.setInput("airParifForecast", []);
    fixture.componentRef.setInput("airParifCouleursIndices", []);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector("#forecast-empty")).toBeTruthy();
    expect(fixture.nativeElement.querySelector("#global-indice")).toBeNull();

    fixture.componentRef.setInput("isLoading", true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector("#forecast-empty")).toBeNull();
    expect(fixture.nativeElement.querySelector("#map-loading")).toBeTruthy();
  });

  it("Should interact with sidebar control and handle destroy", async () => {
    fixture.componentRef.setInput("airParifForecast", [
      {
        date: "2022-10-08",
        no2: "MOYEN",
        o3: "BON",
        pm10: "BON",
        pm25: "BON",
        so2: "BON",
        indice: "MOYEN"
      }
    ] as unknown);
    fixture.componentRef.setInput("airParifCouleursIndices", []);
    fixture.componentRef.setInput("airParifApiKey", "test-key");
    await fixture.whenStable();

    const sidebarNative = fixture.nativeElement.querySelector("#sidebar");
    const tabLink = sidebarNative?.querySelector("a[href='#home']");
    const closeBtn = sidebarNative?.querySelector(".sidebar-close");

    expect(sidebarNative?.classList.contains("collapsed")).toBe(true);

    tabLink?.dispatchEvent(new MouseEvent("click"));
    expect(sidebarNative?.classList.contains("collapsed")).toBe(false);

    closeBtn?.dispatchEvent(new MouseEvent("click"));
    expect(sidebarNative?.classList.contains("collapsed")).toBe(true);

    component.openSidebar();
    expect(sidebarNative?.classList.contains("collapsed")).toBe(false);

    component.ngOnDestroy();
  });

  it("Should dispose the map and all its layers, also the hidden one, on destroy", async () => {
    const map = await createMap("test-key");
    const mapDisposeSpy = vi.spyOn(map, "dispose");
    const layerDisposeSpy = vi.spyOn(TileLayer.prototype, "dispose");

    fixture.destroy();
    expect(mapDisposeSpy).toHaveBeenCalledTimes(1);
    // OpenStreetMap layer, and the forecast layers of today and tomorrow
    expect(layerDisposeSpy).toHaveBeenCalledTimes(3);
    expect(map.getTargetElement()).toBeFalsy();
  });

  /** Forecast layer displayed on the OpenLayers map, above the OpenStreetMap one. */
  function getForecastLayer(map: OlMap): TileLayer<TileWMS> {
    return map.getLayers().item(1) as TileLayer<TileWMS>;
  }

  /** Url of a tile of the forecast layer, as requested by OpenLayers. */
  function getTileUrl(layer: TileLayer<TileWMS>): string | undefined {
    return layer.getSource()?.getTileUrlFunction()([11, 1037, 704], 1, getProjection("EPSG:3857")!);
  }

  /** Displays the map, returning the OpenLayers map to which the sidebar is added. */
  async function createMap(
    apiKey: string | undefined,
    forecast: AirparifForecast[] = []
  ): Promise<OlMap> {
    const addControlSpy = vi.spyOn(OlMap.prototype, "addControl");
    fixture.componentRef.setInput("airParifForecast", forecast);
    fixture.componentRef.setInput("airParifCouleursIndices", []);
    fixture.componentRef.setInput("airParifApiKey", apiKey);
    await fixture.whenStable();
    expect(addControlSpy).toHaveBeenCalledTimes(1);
    return addControlSpy.mock.contexts[0] as OlMap;
  }

  /** Url of a tile of the forecast layer, as requested by OpenLayers. */
  async function getForecastTileUrl(apiKey: string | undefined): Promise<string | undefined> {
    return getTileUrl(getForecastLayer(await createMap(apiKey)));
  }

  it("Should send the API key with the requests of the forecast tiles", async () => {
    expect(await getForecastTileUrl("test-key")).toContain("authkey=test-key");
  });

  it.each([undefined, ""])(
    "Should not send an empty API key (%j) with the requests of the forecast tiles",
    async (apiKey) => {
      const url = await getForecastTileUrl(apiKey);
      expect(url).toContain("LAYERS=");
      expect(url).not.toContain("authkey");
    }
  );

  it("Should display the forecast layer of the selected day on the map", async () => {
    const map = await createMap("test-key", [
      {
        date: "2022-10-08",
        no2: "BON",
        o3: "BON",
        pm10: "BON",
        pm25: "BON",
        so2: "BON",
        indice: "BON"
      },
      {
        date: "2022-10-09",
        no2: "BON",
        o3: "BON",
        pm10: "BON",
        pm25: "BON",
        so2: "BON",
        indice: "BON"
      }
    ] as unknown as AirparifForecast[]);
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      ".forecast-select-button"
    );
    expect(map.getLayers().getLength()).toEqual(2);
    expect(getTileUrl(getForecastLayer(map))).toContain(
      "LAYERS=siteweb%3Avue_indice_atmo_2020_com&"
    );

    buttons[1].click();
    expect(map.getLayers().getLength()).toEqual(2);
    expect(getTileUrl(getForecastLayer(map))).toContain(
      "LAYERS=siteweb%3Avue_indice_atmo_2020_com_jp1"
    );

    buttons[0].click();
    expect(getTileUrl(getForecastLayer(map))).toContain(
      "LAYERS=siteweb%3Avue_indice_atmo_2020_com&"
    );
  });

  describe("Forecast display", () => {
    const forecasts = [
      {
        date: "2022-10-08",
        no2: "MOYEN",
        o3: "BON",
        pm10: "DEGRADE",
        pm25: "BON",
        so2: "BON",
        indice: "DEGRADE"
      },
      {
        date: "2022-10-09",
        no2: "BON",
        o3: "BON",
        pm10: "BON",
        pm25: "BON",
        so2: "BON",
        indice: "BON"
      }
    ] as unknown as AirparifForecast[];
    const couleurs = [
      { name: "BON", color: "#50f0e6" },
      { name: "DEGRADE", color: "#f0e641" }
    ] as unknown as AirparifCouleur[];

    let element: HTMLElement;

    beforeEach(async () => {
      element = fixture.nativeElement as HTMLElement;
      fixture.componentRef.setInput("airParifForecast", forecasts);
      fixture.componentRef.setInput("airParifCouleursIndices", couleurs);
      await fixture.whenStable();
    });

    function getForecastButtons(): HTMLButtonElement[] {
      return Array.from(element.querySelectorAll<HTMLButtonElement>(".forecast-select-button"));
    }

    it("Should display the forecast of today", () => {
      expect(element.querySelector("#sidebar-title")?.textContent).toContain("Qualité de l'air");
      expect(element.querySelector("#sidebar-date")?.textContent).toContain("Saturday 8 October");
      expect(element.querySelector("#sidebar-tab-indice")?.className).toEqual("indice-degrade");

      const [todayButton, tomorrowButton] = getForecastButtons();
      expect(todayButton.textContent).toContain("Aujourd'hui");
      expect(todayButton.classList).toContain("active");
      expect(todayButton.getAttribute("aria-selected")).toEqual("true");
      expect(tomorrowButton.textContent).toContain("Demain");
      expect(tomorrowButton.classList).not.toContain("active");

      expect(element.querySelector("#global-indice")?.className).toContain("indice-soft-degrade");
      expect(element.querySelector("#global-indice-label")?.textContent).toContain("Indice global");
      expect(element.querySelector("#global-indice-value")?.textContent).toContain("Dégradé");
      expect(element.querySelector("#global-indice-color mat-icon")?.textContent).toContain(
        "sentiment_neutral"
      );
      expect(element.querySelector("#global-indice-advice")?.textContent).toContain(
        "Les personnes sensibles devraient limiter les efforts intenses en extérieur."
      );

      const pollutants = element.querySelectorAll(".airparif-indice");
      expect(pollutants).toHaveLength(5);
      expect(pollutants[0].querySelector(".pollutant-formula")?.textContent).toContain("NO₂");
      expect(pollutants[0].querySelector(".indice-badge")?.textContent).toContain("Moyen");
      expect(pollutants[2].querySelector(".indice-badge")?.className).toContain("indice-degrade");

      const legend = element.querySelectorAll("#indices-legend .indice-label");
      expect(legend).toHaveLength(2);
      expect(legend[0].classList).not.toContain("active");
      expect(legend[1].classList).toContain("active");
      expect(element.querySelector("#airparif-source")?.getAttribute("href")).toEqual(
        TestBed.inject(AirparifWidgetService).AIRPARIF_WEBSITE_URL
      );
      expect(element.querySelector("#forecast-empty")).toBeNull();
      expect(element.querySelector("#map-loading")).toBeNull();
    });

    it("Should display the forecast of tomorrow, then of today", async () => {
      getForecastButtons()[1].click();
      await fixture.whenStable();

      expect(getForecastButtons()[1].classList).toContain("active");
      expect(getForecastButtons()[0].classList).not.toContain("active");
      expect(element.querySelector("#sidebar-date")?.textContent).toContain("Sunday 9 October");
      expect(element.querySelector("#global-indice-value")?.textContent).toContain("Bon");
      expect(element.querySelector("#indices-legend .indice-label.active")?.textContent).toContain(
        "Bon"
      );

      getForecastButtons()[0].click();
      await fixture.whenStable();
      expect(getForecastButtons()[0].classList).toContain("active");
      expect(element.querySelector("#global-indice-value")?.textContent).toContain("Dégradé");
    });

    it("Should keep displaying the selected day when the forecast is refreshed", async () => {
      getForecastButtons()[1].click();
      await fixture.whenStable();

      fixture.componentRef.setInput("airParifForecast", [
        { ...forecasts[0], date: "2022-10-09" },
        { ...forecasts[1], date: "2022-10-10", indice: "MAUVAIS" }
      ] as unknown);
      await fixture.whenStable();

      // The tomorrow tab is still selected, so its forecast is displayed
      expect(getForecastButtons()[1].classList).toContain("active");
      expect(element.querySelector("#sidebar-date")?.textContent).toContain("Monday 10 October");
      expect(element.querySelector("#global-indice-value")?.textContent).toContain("Mauvais");
    });

    it("Should only display the forecast of today when there is no forecast for tomorrow", async () => {
      fixture.componentRef.setInput("airParifForecast", [forecasts[0]]);
      await fixture.whenStable();

      expect(getForecastButtons()).toHaveLength(1);
      expect(element.querySelector("#global-indice-value")?.textContent).toContain("Dégradé");
    });

    it("Should display a default icon for an unknown indice", async () => {
      fixture.componentRef.setInput("airParifForecast", [
        { ...forecasts[0], indice: "INCONNU" }
      ] as unknown);
      await fixture.whenStable();

      expect(element.querySelector("#global-indice-color mat-icon")?.textContent).toContain("air");
      expect(element.querySelector("#global-indice-value")?.textContent).toContain("INCONNU");
      expect(element.querySelector("#global-indice-advice")).toBeNull();
    });
  });
});
