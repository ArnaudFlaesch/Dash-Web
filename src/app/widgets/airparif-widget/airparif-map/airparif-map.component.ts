import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  OnDestroy,
  signal,
  viewChild
} from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import TileLayer from "ol/layer/Tile";
import Map from "ol/Map";
import { fromLonLat, transformExtent } from "ol/proj";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import View from "ol/View";

import { AirParifWidgetService } from "../airparif-widget.service";
import { AirParifIndiceEnum, ForecastMode, IAirParifCouleur, IForecast } from "../model/IAirParif";
import { SidebarControl } from "../SidebarControl";

export interface SidebarOptions {
  element: HTMLElement | string;
  position?: "left" | "right";
}

@Component({
  selector: "dash-airparif-map",
  templateUrl: "./airparif-map.component.html",
  styleUrls: ["./airparif-map.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, MatButton]
})
export class AirParifMapComponent implements AfterViewInit, OnDestroy {
  public readonly mapContainer = viewChild<ElementRef>("map");
  public readonly sidebarContainer = viewChild<ElementRef>("sidebar");
  public readonly airParifCouleursIndices = input.required<IAirParifCouleur[]>();
  public readonly airParifForecast = input.required<IForecast[]>();
  public readonly airParifApiKey = input<string>();

  public readonly forecastMode = signal<ForecastMode>(ForecastMode.TODAY);
  public readonly forecastToDisplay = linkedSignal<IForecast | undefined>(
    () => this.airParifForecast()[0]
  );

  public readonly isForecastModeToday = computed(() => this.forecastMode() === ForecastMode.TODAY);
  public readonly isForecastModeTomorrow = computed(
    () => this.forecastMode() === ForecastMode.TOMORROW
  );

  private readonly airParifWidgetService = inject(AirParifWidgetService);

  private readonly airParifUrl = "https://magellan.airparif.asso.fr/geoserver/";
  private map: Map | undefined;
  private readonly airParifForecastTodayLayer: TileLayer<TileWMS>;
  private readonly airParifForecastTomorrowLayer: TileLayer<TileWMS>;
  private sidebarControl: SidebarControl | undefined;

  public constructor() {
    this.airParifForecastTodayLayer = new TileLayer({
      opacity: 0.5,
      source: new TileWMS({
        url: this.airParifUrl + "siteweb/wms",
        params: this.getAirParifWmsParams("siteweb:vue_indice_atmo_2020_com"),
        attributions: `<a href="${this.airParifWidgetService.getAirParifWebsiteUrl()}">AirParif</a>`
      })
    });
    this.airParifForecastTomorrowLayer = new TileLayer({
      opacity: 0.5,
      source: new TileWMS({
        url: this.airParifUrl + "siteweb/wms",
        params: this.getAirParifWmsParams("siteweb:vue_indice_atmo_2020_com_jp1"),
        attributions: `<a href="${this.airParifWidgetService.getAirParifWebsiteUrl()}">AirParif</a>`
      })
    });
  }

  public ngAfterViewInit(): void {
    this.initMap();
  }

  public ngOnDestroy(): void {
    if (this.sidebarControl) {
      this.map?.removeControl(this.sidebarControl);
    }
    this.map?.setTarget(undefined);
    this.map?.dispose();
  }

  public selectTodayForecast(): void {
    this.map?.removeLayer(this.airParifForecastTomorrowLayer);
    this.forecastMode.set(ForecastMode.TODAY);
    this.forecastToDisplay.set(this.airParifForecast()[0]);
    this.map?.addLayer(this.airParifForecastTodayLayer);
  }

  public selectTomorrowForecast(): void {
    this.map?.removeLayer(this.airParifForecastTodayLayer);
    this.forecastMode.set(ForecastMode.TOMORROW);
    this.forecastToDisplay.set(this.airParifForecast()[1]);
    this.map?.addLayer(this.airParifForecastTomorrowLayer);
  }

  public getColorFromIndice(indice: AirParifIndiceEnum): string {
    return (
      this.airParifCouleursIndices().find((couleurIndice) => couleurIndice.name === indice)
        ?.color ?? ""
    );
  }

  private initMap(): void {
    const mapContainer = this.mapContainer();
    if (!mapContainer) {
      return;
    }

    const maxExtent = transformExtent([1.44, 48.12, 3.56, 49.24], "EPSG:4326", "EPSG:3857");

    const openStreetMapLayer = new TileLayer({
      source: new OSM()
    });

    const sidebarElement =
      this.sidebarContainer()?.nativeElement ?? document.getElementById("sidebar");

    if (sidebarElement) {
      this.sidebarControl = new SidebarControl({
        element: sidebarElement,
        position: "left"
      });
    }

    this.map = new Map({
      target: mapContainer.nativeElement,
      layers: [openStreetMapLayer, this.airParifForecastTodayLayer],
      view: new View({
        center: fromLonLat([2.3488, 48.8502]),
        zoom: 11,
        maxZoom: 18,
        extent: maxExtent
      })
    });

    if (this.sidebarControl) {
      this.map.addControl(this.sidebarControl);
    }
  }

  private getAirParifWmsParams(layer: string): Record<string, unknown> {
    const params: Record<string, unknown> = {
      SERVICE: "WMS",
      VERSION: "1.3.0",
      LAYERS: layer,
      TILED: true,
      TRANSPARENT: true,
      FORMAT: "image/png8",
      STYLES: "nouvel_indice_polygones"
    };
    const apiKey = this.airParifApiKey();
    if (apiKey) {
      params["authkey"] = apiKey;
    }
    return params;
  }
}
