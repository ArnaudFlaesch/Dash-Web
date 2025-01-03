import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AirParifWidgetService } from "../airparif-widget.service";
import { AirParifIndiceEnum, IAirParifCouleur, IForecast } from "../model/IAirParif";
import { AirParifMapComponent } from "./airparif-map.component";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("AirParifMapComponent", () => {
  let component: AirParifMapComponent;
  let fixture: ComponentFixture<AirParifMapComponent>;

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

    expect(component.getColorFromIndice("BON" as AirParifIndiceEnum)).toEqual("#50f0e6");
    expect(component.getColorFromIndice("null" as AirParifIndiceEnum)).toEqual("");

    expect(component.isForecastModeToday()).toEqual(true);
    component.selectTomorrowForecast();
    expect(component.isForecastModeTomorrow()).toEqual(true);
    component.selectTodayForecast();
    expect(component.forecastToDisplay?.no2).toEqual("MOYEN");
  });
});
