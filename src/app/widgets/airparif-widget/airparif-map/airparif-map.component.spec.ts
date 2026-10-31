import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AirParifWidgetService } from "../airparif-widget.service";
import { AirParifIndiceEnum, IAirParifCouleur, IForecast } from "../model/IAirParif";
import { AirParifMapComponent } from "./airparif-map.component";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("AirParifMapComponent", () => {
  let component: AirParifMapComponent;
  let fixture: ComponentFixture<AirParifMapComponent>;

  beforeAll(() => {
    if (typeof window !== "undefined" && !window.ResizeObserver) {
      window.ResizeObserver = class ResizeObserver {
        public observe(): void {}
        public unobserve(): void {}
        public disconnect(): void {}
      };
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AirParifWidgetService]
    }).compileComponents();

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

  it("Should display an empty state without forecast", () => {
    fixture.componentRef.setInput("airParifForecast", []);
    fixture.componentRef.setInput("airParifCouleursIndices", []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector("#forecast-empty")).toBeTruthy();
    expect(component.globalIndiceDetails()).toBeUndefined();

    fixture.componentRef.setInput("isLoading", true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector("#forecast-empty")).toBeNull();
    expect(fixture.nativeElement.querySelector("#map-loading")).toBeTruthy();
  });

  it("Should interact with sidebar control and handle destroy", () => {
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
    fixture.detectChanges();

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
});
