import { Component, AfterViewInit, Inject } from '@angular/core';
import * as L from 'leaflet';
import { AirParifWidgetService } from './airparif-widget.service';

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

  public isWidgetLoaded = true;

  constructor(
    @Inject('widgetId') private widgetId: number,
    private airParifWidgetService: AirParifWidgetService
  ) {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  public refreshWidget() {
    if (this.airParifApiKey && this.communeInseeCode) {
      this.airParifWidgetService
        .getCommunePrevision(this.communeInseeCode)
        .subscribe({ next: (result) => console.log(result) });

      this.airParifWidgetService.getColors().subscribe({ next: (result) => console.log(result) });
    }
  }

  private initMap(): void {
    const southWest = L.latLng(48.12, 1.44),
      northEast = L.latLng(49.24, 3.56),
      bounds = L.latLngBounds(southWest, northEast);

    const openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    const airParif = L.tileLayer.wms(
      this.airParifUrl + 'siteweb/wms',
      this.getWmsOptions(
        'siteweb:vue_indice_atmo_2020_com',
        `<a href="${this.airParifWebsiteUrl}">AirParif</a>`
      )
    );
    const airParif2 = L.tileLayer.wms(
      this.airParifUrl + 'siteweb/wms',
      this.getWmsOptions(
        'siteweb:vue_indice_atmo_2020_com_jp1',
        `<a href="${this.airParifWebsiteUrl}">AirParif</a>`
      )
    );

    /*   const airParif3 = L.tileLayer.wms(
      'https://magellan.airparif.asso.fr/geoserver/apisHorAir/wms?',
      this.getIndiceWmsOptions()
    );*/

    this.map = L.map('map', {
      center: [48.8502, 2.3488],
      zoom: 11,
      maxBounds: bounds,
      layers: [openStreetMapLayer, airParif, airParif2]
    });

    const baseMaps = {
      OpenStreetMap: openStreetMapLayer
    };

    const overlayMaps = {
      AirParif: airParif,
      'AirParif demain': airParif2
    };

    L.control.layers(baseMaps, overlayMaps).addTo(this.map);
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

  /* private getIndiceWmsOptions() {
    return {
      service: 'WMS',
      version: '1.3',
      layers: 'apisHorAir:indice_api',
      tiled: true,
      transparent: true,
      format: 'image/png8',
      styles: 'indice',
      opacity: 0.5,
      authkey: this.airparifToken
    };
  }*/

  public isFormValid = (): boolean =>
    this.airParifApiKey !== null &&
    this.airParifApiKey.length > 0 &&
    this.communeInseeCode !== null &&
    this.communeInseeCode.length > 0;

  public getWidgetData = (): { airParifApiKey: string; communeInseeCode: string } | null =>
    this.airParifApiKey && this.communeInseeCode
      ? { airParifApiKey: this.airParifApiKey, communeInseeCode: this.communeInseeCode }
      : null;
}
