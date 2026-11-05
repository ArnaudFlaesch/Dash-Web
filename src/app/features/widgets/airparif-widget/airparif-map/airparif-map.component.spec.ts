import { ComponentFixture, TestBed } from "@angular/core/testing";
import { get as getProjection } from "ol/proj";
import { AirParifIndiceEnum, IAirParifCouleur, IForecast } from "../airparif.model";
import { AirParifMapComponent } from "./airparif-map.component";

describe("AirParifMapComponent", () => {
  let component: AirParifMapComponent;
  let fixture: ComponentFixture<AirParifMapComponent>;

  beforeAll(() => {
    if (typeof window !== "undefined" && !window.ResizeObserver) {
      window.ResizeObserver = class ResizeObserver {
        public observe = vi.fn();
        public unobserve = vi.fn();
        public disconnect = vi.fn();
      };
    }
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(AirParifMapComponent);
    component = fixture.componentInstance;
  });

  it("Should create an AirParif map", () => {
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
    ] as unknown as IAirParifCouleur[];

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
    ] as unknown as IForecast[];

    fixture.componentRef.setInput("airParifForecast", forecastData);
    fixture.componentRef.setInput("airParifCouleursIndices", couleursIndicesData);
    component.ngAfterViewInit();

    expect(component.getIndiceClass("BON" as AirParifIndiceEnum)).toEqual("indice-bon");
    expect(component.getIndiceClass("TRES_MAUVAIS" as AirParifIndiceEnum)).toEqual(
      "indice-tres-mauvais"
    );

    expect(component.getIndiceSoftClass("DEGRADE" as AirParifIndiceEnum)).toEqual(
      "indice-soft-degrade"
    );
    expect(component.getIndiceLabel("DEGRADE" as AirParifIndiceEnum)).toEqual("Dégradé");
    expect(component.globalIndiceDetails()?.icon).toEqual("sentiment_satisfied");

    expect(component.isForecastModeToday()).toEqual(true);
    component.selectTomorrowForecast();
    expect(component.isForecastModeTomorrow()).toEqual(true);
    component.selectTodayForecast();
    expect(component.forecastToDisplay()?.no2).toEqual("MOYEN");
  });

  it("Should display an empty state without forecast", async () => {
    fixture.componentRef.setInput("airParifForecast", []);
    fixture.componentRef.setInput("airParifCouleursIndices", []);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector("#forecast-empty")).toBeTruthy();
    expect(component.globalIndiceDetails()).toBeUndefined();

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
    ] as unknown as IForecast[]);
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

  /** Url of a tile of the forecast layer, as requested by OpenLayers. */
  async function getForecastTileUrl(apiKey: string | undefined): Promise<string | undefined> {
    fixture.componentRef.setInput("airParifForecast", []);
    fixture.componentRef.setInput("airParifCouleursIndices", []);
    fixture.componentRef.setInput("airParifApiKey", apiKey);
    await fixture.whenStable();
    const source = component["forecastLayers"]?.[component.forecastMode()].getSource();
    return source?.getTileUrlFunction()([11, 1037, 704], 1, getProjection("EPSG:3857")!);
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
    ] as unknown as IForecast[];
    const couleurs = [
      { name: "BON", color: "#50f0e6" },
      { name: "DEGRADE", color: "#f0e641" }
    ] as unknown as IAirParifCouleur[];

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
      expect(element.querySelector("#sidebar-title")?.textContent).toContain(
        component.labels.airQuality
      );
      expect(element.querySelector("#sidebar-date")?.textContent).toContain("Saturday 8 October");
      expect(element.querySelector("#sidebar-tab-indice")?.className).toEqual("indice-degrade");

      const [todayButton, tomorrowButton] = getForecastButtons();
      expect(todayButton.textContent).toContain(component.labels.today);
      expect(todayButton.classList).toContain("active");
      expect(todayButton.getAttribute("aria-selected")).toEqual("true");
      expect(tomorrowButton.textContent).toContain(component.labels.tomorrow);
      expect(tomorrowButton.classList).not.toContain("active");

      expect(element.querySelector("#global-indice")?.className).toContain("indice-soft-degrade");
      expect(element.querySelector("#global-indice-label")?.textContent).toContain(
        component.labels.globalIndice
      );
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
        component.airParifWebsiteUrl
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
      ] as unknown as IForecast[]);
      await fixture.whenStable();

      // The tomorrow tab is still selected, so its forecast is displayed
      expect(component.isForecastModeTomorrow()).toBe(true);
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
      ] as unknown as IForecast[]);
      await fixture.whenStable();

      expect(component.globalIndiceDetails()).toBeUndefined();
      expect(element.querySelector("#global-indice-color mat-icon")?.textContent).toContain("air");
      expect(element.querySelector("#global-indice-value")?.textContent).toContain("INCONNU");
      expect(element.querySelector("#global-indice-advice")).toBeNull();
    });
  });
});
