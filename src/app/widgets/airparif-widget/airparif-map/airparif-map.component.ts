import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  viewChild
} from "@angular/core";
import * as L from "leaflet";
import "leaflet-sidebar-v2";

import { AirParifWidgetService } from "../airparif-widget.service";
import { AirParifIndiceEnum, ForecastMode, IAirParifCouleur, IForecast } from "../model/IAirParif";
import { MatButton } from "@angular/material/button";

import { MatIcon } from "@angular/material/icon";

@Component({
  selector: "dash-airparif-map",
  templateUrl: "./airparif-map.component.html",
  styleUrls: ["./airparif-map.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatIcon, MatButton]
})
export class AirParifMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  public readonly mapContainer = viewChild<ElementRef>("map");
  public readonly airParifCouleursIndices = input.required<IAirParifCouleur[]>();
  public readonly airParifForecast = input.required<IForecast[]>();
  public readonly airParifApiKey = input<string>();

  public forecastToDisplay: IForecast | undefined;
  public forecastMode: ForecastMode = ForecastMode.TODAY;
  private readonly airParifWidgetService = inject(AirParifWidgetService);

  private readonly airParifUrl = "https://magellan.airparif.asso.fr/geoserver/";
  private map: L.Map | undefined;
  private readonly airParifForecastTodayLayer: L.Layer;
  private readonly airParifForecastTomorrowLayer: L.Layer;

  private readonly sidebarControl = L.control.sidebar({
    autopan: false,
    closeButton: true,
    container: "sidebar",
    position: "left"
  });

  public constructor() {
    this.airParifForecastTodayLayer = L.tileLayer.wms(
      this.airParifUrl + "siteweb/wms",
      this.getAirParifWmsOptions("siteweb:vue_indice_atmo_2020_com")
    );
    this.airParifForecastTomorrowLayer = L.tileLayer.wms(
      this.airParifUrl + "siteweb/wms",
      this.getAirParifWmsOptions("siteweb:vue_indice_atmo_2020_com_jp1")
    );
  }

  public ngAfterViewInit(): void {
    this.initMap();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes["airParifForecast"] && !this.forecastToDisplay) {
      this.selectTodayForecast();
    }
  }

  public ngOnDestroy(): void {
    this.map?.removeControl(this.sidebarControl);
    this.map?.off();
    this.map?.remove();
  }

  public selectTodayForecast(): void {
    this.map?.removeLayer(this.airParifForecastTomorrowLayer);
    this.forecastMode = ForecastMode.TODAY;
    this.forecastToDisplay = this.airParifForecast()[0];
    this.map?.addLayer(this.airParifForecastTodayLayer);
  }

  public selectTomorrowForecast(): void {
    this.map?.removeLayer(this.airParifForecastTodayLayer);
    this.forecastMode = ForecastMode.TOMORROW;
    this.forecastToDisplay = this.airParifForecast()[1];
    this.map?.addLayer(this.airParifForecastTomorrowLayer);
  }

  public isForecastModeToday(): boolean {
    return this.forecastMode === ForecastMode.TODAY;
  }

  public isForecastModeTomorrow(): boolean {
    return this.forecastMode === ForecastMode.TOMORROW;
  }

  public getColorFromIndice(indice: AirParifIndiceEnum): string {
    return (
      this.airParifCouleursIndices().find((couleurIndice) => couleurIndice.name === indice)
        ?.color ?? ""
    );
  }

  private initMap(): void {
    const southWest = L.latLng(48.12, 1.44),
      northEast = L.latLng(49.24, 3.56),
      bounds = L.latLngBounds(southWest, northEast);

    const openStreetMapLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    const mapContainer = this.mapContainer();
    if (mapContainer) {
      this.map = L.map(mapContainer.nativeElement, {
        center: [48.8502, 2.3488],
        zoom: 11,
        maxBounds: bounds,
        layers: [openStreetMapLayer, this.airParifForecastTodayLayer]
      });

      L.control.layers({ OpenStreetMap: openStreetMapLayer }).addTo(this.map);

      this.sidebarControl.addTo(this.map);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private getAirParifWmsOptions(layer: string) {
    return {
      service: "WMS",
      version: "1.3",
      layers: layer,
      tiled: true,
      transparent: true,
      format: "image/png8",
      styles: "nouvel_indice_polygones",
      opacity: 0.5,
      attribution: `<a href="${this.airParifWidgetService.getAirParifWebsiteUrl()}">AirParif</a>`,
      authkey: this.airParifApiKey()
    };
  }
}
