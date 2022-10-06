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

  private airparifToken = '1dfea964-b7ab-a47c-3602-ee56d6603217';

  public isWidgetLoaded = true;

  constructor(
    @Inject('widgetId') private widgetId: number,
    private airParifWidgetService: AirParifWidgetService
  ) {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  public refreshWidget() {
    this.airParifWidgetService
      .getCommunePrevision('75101')
      .subscribe({ next: (result) => console.log(result) });
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [39.8282, -98.5795],
      zoom: 3
    });
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    const magellan = `https://magellan.airparif.asso.fr/geoserver/apisHorAir/wms?service=WMS&version=1.3&request=GetMap&layers=apisHorAir:no2_api&styles=&bbox=534892,2346865,690142,2471690&width=768&height=617&srs=EPSG:27572&format=image/png&authkey=${this.airparifToken}`;

    const tile2 = L.tileLayer(magellan, {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
    tile2.addTo(this.map);
  }
}
