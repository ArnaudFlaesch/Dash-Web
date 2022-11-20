import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-sidebar-v2';

import { ErrorHandlerService } from './../../services/error.handler.service';
import { AirParifWidgetService } from './airparif-widget.service';
import {
  AirParifIndiceEnum,
  ForecastMode,
  IAirParifCouleur,
  IForecast
} from './model/IAirParif';

@Component({
  selector: 'app-airparif-widget',
  templateUrl: './airparif-widget.component.html',
  styleUrls: ['./airparif-widget.component.scss']
})
export class AirParifWidgetComponent implements AfterViewInit {
  private map: L.Map | undefined;

  private airParifUrl = 'https://magellan.airparif.asso.fr/geoserver/';
  public airParifWebsiteUrl = 'https://www.airparif.asso.fr';

  public airParifApiKey: string | null = null;
  public communeInseeCode: string | null = null;

  public airParifCouleursIndices: IAirParifCouleur[] = [];
  public airParifForecast: IForecast[] = [];
  public forecastToDisplay: IForecast | undefined;

  public forecastMode: ForecastMode = ForecastMode.TODAY;

  public isWidgetLoaded = true;

  private ERROR_GETTING_AIRPARIF_FORECAST =
    "Erreur lors de la récupération des prévisions d'AirParif.";
  private ERROR_GETTING_AIRPARIF_COLOR_INDICES =
    "Erreur lors de la récupération des couleurs d'indices d'AirParif.";

  private airParifForecastTodayLayer: L.Layer;
  private airParifForecastTomorrowLayer: L.Layer;

  constructor(
    private airParifWidgetService: AirParifWidgetService,
    private errorHandlerService: ErrorHandlerService
  ) {
    this.airParifForecastTodayLayer = L.tileLayer.wms(
      this.airParifUrl + 'siteweb/wms',
      this.getWmsOptions(
        'siteweb:vue_indice_atmo_2020_com',
        `<a href="${this.airParifWebsiteUrl}">AirParif</a>`
      )
    );
    this.airParifForecastTomorrowLayer = L.tileLayer.wms(
      this.airParifUrl + 'siteweb/wms',
      this.getWmsOptions(
        'siteweb:vue_indice_atmo_2020_com_jp1',
        `<a href="${this.airParifWebsiteUrl}">AirParif</a>`
      )
    );
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  public refreshWidget(): void {
    if (this.airParifApiKey && this.communeInseeCode) {
      this.airParifWidgetService
        .getCommunePrevision(this.communeInseeCode)
        .subscribe({
          next: (forecast) => {
            this.airParifForecast = forecast;
            this.selectTodayForecast();
          },
          error: (error) =>
            this.errorHandlerService.handleError(
              error.message,
              this.ERROR_GETTING_AIRPARIF_FORECAST
            )
        });

      this.airParifWidgetService.getColors().subscribe({
        next: (airParifColors) =>
          (this.airParifCouleursIndices = airParifColors),
        error: (error) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_GETTING_AIRPARIF_COLOR_INDICES
          )
      });
    }
  }

  private initMap(): void {
    const mapContainerDocumentId = 'map';

    const southWest = L.latLng(48.12, 1.44),
      northEast = L.latLng(49.24, 3.56),
      bounds = L.latLngBounds(southWest, northEast);

    const openStreetMapLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        attribution:
          '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
    );
    if (
      document.getElementById(mapContainerDocumentId) &&
      this.map === undefined
    ) {
      this.map = L.map(mapContainerDocumentId, {
        center: [48.8502, 2.3488],
        zoom: 11,
        maxBounds: bounds,
        layers: [openStreetMapLayer, this.airParifForecastTodayLayer]
      });

      L.control.layers({ OpenStreetMap: openStreetMapLayer }).addTo(this.map);

      L.control
        .sidebar({
          autopan: false,
          closeButton: true,
          container: 'sidebar',
          position: 'left'
        })
        .addTo(this.map);
    }
  }

  private getWmsOptions(layer: string, attribution: string) {
    return {
      service: 'WMS',
      version: '1.3',
      layers: layer,
      tiled: true,
      transparent: true,
      format: 'image/png8',
      styles: 'nouvel_indice_polygones',
      opacity: 0.5,
      attribution: attribution,
      authkey: this.airParifApiKey
    };
  }

  public selectTodayForecast(): void {
    this.map?.removeLayer(this.airParifForecastTomorrowLayer);
    this.forecastMode = ForecastMode.TODAY;
    this.forecastToDisplay = this.airParifForecast[0];
    this.map?.addLayer(this.airParifForecastTodayLayer);
  }

  public selectTomorrowForecast(): void {
    this.map?.removeLayer(this.airParifForecastTodayLayer);
    this.forecastMode = ForecastMode.TOMORROW;
    this.forecastToDisplay = this.airParifForecast[1];
    this.map?.addLayer(this.airParifForecastTomorrowLayer);
  }

  public getColorFromIndice(indice: AirParifIndiceEnum): string {
    return (
      this.airParifCouleursIndices.find(
        (couleurIndice) => couleurIndice.name === indice
      )?.color || ''
    );
  }

  public isForecastModeToday(): boolean {
    this.forecastMode === ForecastMode.TODAY;
  }

  public isForecastModeTomorrow(): boolean {
    return this.forecastMode === ForecastMode.TOMORROW;
  }

  public isFormValid(): boolean {
    return (
      this.airParifApiKey !== null &&
      this.airParifApiKey.length > 0 &&
      this.communeInseeCode !== null &&
      this.communeInseeCode.length > 0
    );
  }

  public getWidgetData(): {
    airParifApiKey: string;
    communeInseeCode: string;
  } | null {
    return this.airParifApiKey && this.communeInseeCode
      ? {
          airParifApiKey: this.airParifApiKey,
          communeInseeCode: this.communeInseeCode
        }
      : null;
  }
}
