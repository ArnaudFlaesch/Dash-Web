import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  input
} from "@angular/core";
import { SidePanel } from "ol-side-panel";
import { Tile as TileLayer } from "ol/layer.js";
import Map from "ol/Map";
import { TileWMS } from "ol/source";
import { Options } from "ol/source/TileWMS";
import XYZ from "ol/source/XYZ";
import View from "ol/View.js";
import { AirParifWidgetService } from "../airparif-widget.service";
import { AirParifIndiceEnum, ForecastMode, IAirParifCouleur, IForecast } from "../model/IAirParif";

@Component({
  selector: "dash-airparif-map",
  templateUrl: "./airparif-map.component.html",
  styleUrls: ["./airparif-map.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class AirParifMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly airParifWidgetService = inject(AirParifWidgetService);

  public readonly airParifCouleursIndices = input.required<IAirParifCouleur[]>();
  public readonly airParifForecast = input.required<IForecast[]>();

  public readonly airParifApiKey = input<string>();

  public forecastToDisplay: IForecast | undefined;
  public forecastMode: ForecastMode = ForecastMode.TODAY;

  private readonly airParifUrl = "https://magellan.airparif.asso.fr/geoserver/";
  private map: Map | undefined;
  private readonly airParifForecastTodayLayer: TileLayer<TileWMS>;
  private readonly airParifForecastTomorrowLayer: TileLayer<TileWMS>;

  /*
  private sidebarControl = L.control.sidebar({
    autopan: false,
    closeButton: true,
    container: "sidebar",
    position: "left"
  });*/

  constructor() {
    this.airParifForecastTodayLayer = new TileLayer({
      source: new TileWMS({
        url: this.airParifUrl + "siteweb/wms",
        ...this.getAirParifWmsOptions("siteweb:vue_indice_atmo_2020_com")
      })
    });

    this.airParifForecastTomorrowLayer = new TileLayer({
      source: new TileWMS({
        url: this.airParifUrl + "siteweb/wms",
        ...this.getAirParifWmsOptions("siteweb:vue_indice_atmo_2020_com_jp1")
      })
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["airParifForecast"] && !this.forecastToDisplay) {
      this.selectTodayForecast();
    }
  }

  ngOnDestroy(): void {
    /*this.map?.removeControl(this.sidebarControl);
    this.map?.off();
    this.map?.remove();*/
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
    /* const southWest = L.latLng(48.12, 1.44),
      northEast = L.latLng(49.24, 3.56),
      bounds = L.latLngBounds(southWest, northEast);
*/
    const sidePanel = new SidePanel();
    this.map = new Map({
      target: "map",
      layers: [
        new TileLayer({
          source: new XYZ({
            url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          }),
          maxZoom: 18
        }),
        this.airParifForecastTodayLayer
      ],
      view: new View({
        center: [2.34694, 48.858885],
        zoom: 11,
        projection: "EPSG:4326"
      })
    });

    /*  this.map = L.map(mapContainer.nativeElement, {
        maxBounds: bounds,
        layers: [openStreetMapLayer, this.airParifForecastTodayLayer]
      });

      L.control.layers({ OpenStreetMap: openStreetMapLayer }).addTo(this.map);

      this.sidebarControl.addTo(this.map);*/

    this.map.addControl(sidePanel);
  }

  private getAirParifWmsOptions(layer: string): Options {
    return {
      params: {
        LAYERS: layer,
        TILED: true
      },
      transition: 0
      //format: "image/png8",
      // styles: "nouvel_indice_polygones",
      // opacity: 0.5,
      //attribution: `<a href="${this.airParifWidgetService.getAirParifWebsiteUrl()}">AirParif</a>`,
      // authkey: this.airParifApiKey()
    };
  }
}
