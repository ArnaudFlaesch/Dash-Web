import {
  AfterViewInit,
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
  styleUrl: "./airparif-map.component.scss",
  imports: [MatIcon, MatButton]
})
export class AirParifMapComponent implements AfterViewInit, OnDestroy {
  public readonly mapContainer = viewChild<ElementRef<HTMLElement>>("map");
  public readonly sidebarContainer = viewChild<ElementRef<HTMLElement>>("sidebar");
  public readonly airParifCouleursIndices = input.required<IAirParifCouleur[]>();
  public readonly airParifForecast = input.required<IForecast[]>();
  public readonly airParifApiKey = input<string>();

  public readonly forecastMode = signal(ForecastMode.TODAY);
  public readonly forecastToDisplay = linkedSignal<IForecast | undefined>(
    () => this.airParifForecast()[0]
  );

  public readonly isForecastModeToday = computed(() => this.forecastMode() === ForecastMode.TODAY);
  public readonly isForecastModeTomorrow = computed(
    () => this.forecastMode() === ForecastMode.TOMORROW
  );

  private readonly airParifWidgetService = inject(AirParifWidgetService);
  private readonly airParifUrl = "https://magellan.airparif.asso.fr/geoserver/siteweb/wms";

  private map: Map | undefined;
  private sidebarControl: SidebarControl | undefined;
  private forecastLayers: Record<ForecastMode, TileLayer<TileWMS>> | undefined;

  public ngAfterViewInit(): void {
    this.initMap();
  }

  public ngOnDestroy(): void {
    if (this.sidebarControl) {
      this.map?.removeControl(this.sidebarControl);
    }
    this.map?.setTarget();
    this.map?.dispose();
  }

  public selectTodayForecast(): void {
    this.selectForecast(ForecastMode.TODAY);
  }

  public selectTomorrowForecast(): void {
    this.selectForecast(ForecastMode.TOMORROW);
  }

  public getColorFromIndice(indice: AirParifIndiceEnum): string {
    return (
      this.airParifCouleursIndices().find((couleurIndice) => couleurIndice.name === indice)
        ?.color ?? ""
    );
  }

  private selectForecast(forecastMode: ForecastMode): void {
    if (this.forecastLayers) {
      this.map?.removeLayer(this.forecastLayers[this.forecastMode()]);
      this.map?.addLayer(this.forecastLayers[forecastMode]);
    }
    this.forecastMode.set(forecastMode);
    this.forecastToDisplay.set(
      this.airParifForecast()[forecastMode === ForecastMode.TODAY ? 0 : 1]
    );
  }

  private initMap(): void {
    const mapContainer = this.mapContainer();
    if (!mapContainer) {
      return;
    }

    // Layers are created here, once the API key input is available
    this.forecastLayers = {
      [ForecastMode.TODAY]: this.createForecastLayer("siteweb:vue_indice_atmo_2020_com"),
      [ForecastMode.TOMORROW]: this.createForecastLayer("siteweb:vue_indice_atmo_2020_com_jp1")
    };

    const sidebarElement = this.sidebarContainer()?.nativeElement;
    if (sidebarElement) {
      this.sidebarControl = new SidebarControl({ element: sidebarElement, position: "left" });
    }

    this.map = new Map({
      target: mapContainer.nativeElement,
      layers: [new TileLayer({ source: new OSM() }), this.forecastLayers[this.forecastMode()]],
      view: new View({
        center: fromLonLat([2.3488, 48.8502]),
        zoom: 11,
        maxZoom: 18,
        extent: transformExtent([1.44, 48.12, 3.56, 49.24], "EPSG:4326", "EPSG:3857")
      })
    });

    if (this.sidebarControl) {
      this.map.addControl(this.sidebarControl);
    }
  }

  private createForecastLayer(layer: string): TileLayer<TileWMS> {
    const apiKey = this.airParifApiKey();
    return new TileLayer({
      opacity: 0.5,
      source: new TileWMS({
        url: this.airParifUrl,
        params: {
          SERVICE: "WMS",
          VERSION: "1.3.0",
          LAYERS: layer,
          TILED: true,
          TRANSPARENT: true,
          FORMAT: "image/png8",
          STYLES: "nouvel_indice_polygones",
          ...(apiKey ? { authkey: apiKey } : {})
        },
        attributions: `<a href="${this.airParifWidgetService.getAirParifWebsiteUrl()}">AirParif</a>`
      })
    });
  }
}
