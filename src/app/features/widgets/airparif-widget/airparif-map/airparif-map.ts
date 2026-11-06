import { DatePipe } from "@angular/common";
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild
} from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { MatProgressBar } from "@angular/material/progress-bar";
import TileLayer from "ol/layer/Tile";
import Map from "ol/Map";
import { fromLonLat, transformExtent } from "ol/proj";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import View from "ol/View";
import { AirparifWidgetService } from "../airparif-widget-service";
import {
  AirparifIndice,
  ForecastMode,
  AirparifCouleur,
  AirparifForecast,
  IndiceDetails,
  Pollutant
} from "../airparif";
import { SidebarControl } from "../sidebar-control";

@Component({
  selector: "dash-airparif-map",
  templateUrl: "./airparif-map.html",
  styleUrl: "./airparif-map.scss",
  imports: [MatIcon, MatProgressBar, DatePipe]
})
export class AirparifMap implements AfterViewInit, OnDestroy {
  private readonly POLLUTANTS: Pollutant[] = [
    { key: "no2", formula: "NO₂", name: "Dioxyde d'azote" },
    { key: "o3", formula: "O₃", name: "Ozone" },
    { key: "pm10", formula: "PM₁₀", name: "Particules < 10 µm" },
    { key: "pm25", formula: "PM₂.₅", name: "Particules fines < 2,5 µm" },
    { key: "so2", formula: "SO₂", name: "Dioxyde de soufre" }
  ];

  // Keyed by the keys of the enum, sent by the API
  private readonly INDICE_DETAILS: Record<keyof typeof AirparifIndice, IndiceDetails> = {
    BON: {
      icon: "sentiment_very_satisfied",
      advice: "Qualité de l'air idéale pour vos activités en extérieur."
    },
    MOYEN: {
      icon: "sentiment_satisfied",
      advice: "Profitez normalement de vos activités en extérieur."
    },
    DEGRADE: {
      icon: "sentiment_neutral",
      advice: "Les personnes sensibles devraient limiter les efforts intenses en extérieur."
    },
    MAUVAIS: {
      icon: "sentiment_dissatisfied",
      advice: "Réduisez les activités physiques intenses en extérieur."
    },
    TRES_MAUVAIS: {
      icon: "sentiment_very_dissatisfied",
      advice: "Évitez les activités physiques intenses en extérieur."
    },
    EXTREMEMENT_MAUVAIS: {
      icon: "masks",
      advice: "Évitez toute activité physique en extérieur."
    }
  };

  private readonly SIDEBAR_PANE_ID = "home";

  private readonly AIRPARIF_WMS_URL = "https://magellan.airparif.asso.fr/geoserver/siteweb/wms";

  protected readonly labels = {
    airQuality: "Qualité de l'air",
    close: "Fermer",
    today: "Aujourd'hui",
    tomorrow: "Demain",
    globalIndice: "Indice global",
    pollutantDetails: "Détail par polluant",
    mapLegend: "Légende de la carte",
    source: "Source : Airparif",
    noForecast: "Aucune prévision disponible",
    noForecastHint: "Vérifiez la clé d'API et le code commune dans la configuration du widget."
  };

  public readonly mapContainer = viewChild<ElementRef<HTMLElement>>("map");
  public readonly sidebarContainer = viewChild<ElementRef<HTMLElement>>("sidebar");
  public readonly airParifCouleursIndices = input.required<AirparifCouleur[]>();
  public readonly airParifForecast = input.required<AirparifForecast[]>();
  public readonly airParifApiKey = input<string>();
  public readonly isLoading = input(false);

  private readonly forecastMode = signal(ForecastMode.TODAY);
  // Forecast of the selected day, also when the forecasts are refreshed
  protected readonly forecastToDisplay = computed<AirparifForecast | undefined>(
    () => this.airParifForecast()[this.forecastMode() === ForecastMode.TODAY ? 0 : 1]
  );

  protected readonly pollutants = computed(() => {
    const forecast = this.forecastToDisplay();
    return forecast
      ? this.POLLUTANTS.map((pollutant) => ({
          ...pollutant,
          indice: forecast[pollutant.key]
        }))
      : [];
  });

  protected readonly globalIndiceDetails = computed(() => {
    const forecast = this.forecastToDisplay();
    return forecast ? this.getIndiceDetails(forecast.indice) : undefined;
  });

  protected readonly isForecastModeToday = computed(
    () => this.forecastMode() === ForecastMode.TODAY
  );
  protected readonly isForecastModeTomorrow = computed(
    () => this.forecastMode() === ForecastMode.TOMORROW
  );

  private map: Map | undefined;
  private sidebarControl: SidebarControl | undefined;
  private forecastLayers: Record<ForecastMode, TileLayer<TileWMS>> | undefined;

  protected readonly airParifWebsiteUrl = inject(AirparifWidgetService).AIRPARIF_WEBSITE_URL;
  private readonly airParifWidgetService = inject(AirparifWidgetService);

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

  public openSidebar(): void {
    this.sidebarControl?.open(this.SIDEBAR_PANE_ID);
  }

  protected selectTodayForecast(): void {
    this.selectForecast(ForecastMode.TODAY);
  }

  protected selectTomorrowForecast(): void {
    this.selectForecast(ForecastMode.TOMORROW);
  }

  protected getIndiceClass(indice: AirparifIndice): string {
    return this.airParifWidgetService.getIndiceClass(indice);
  }

  protected getIndiceLabel(indice: AirparifIndice): string {
    return this.airParifWidgetService.getIndiceLabel(indice);
  }

  // Class giving a light tint of the color of the indice
  protected getIndiceSoftClass(indice: AirparifIndice): string {
    return this.airParifWidgetService.getIndiceClass(indice, "indice-soft");
  }

  private getIndiceDetails(indice: AirparifIndice): IndiceDetails | undefined {
    return this.INDICE_DETAILS[indice as unknown as keyof typeof AirparifIndice];
  }

  private selectForecast(forecastMode: ForecastMode): void {
    if (this.forecastLayers) {
      this.map?.removeLayer(this.forecastLayers[this.forecastMode()]);
      this.map?.addLayer(this.forecastLayers[forecastMode]);
    }
    this.forecastMode.set(forecastMode);
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
        url: this.AIRPARIF_WMS_URL,
        params: {
          SERVICE: "WMS",
          VERSION: "1.3.0",
          LAYERS: layer,
          TILED: true,
          TRANSPARENT: true,
          FORMAT: "image/png8",
          STYLES: "nouvel_indice_polygones",
          // OpenLayers leaves the undefined parameters out of the url
          authkey: apiKey || undefined
        },
        attributions: `<a href="${this.airParifWebsiteUrl}">Airparif</a>`
      })
    });
  }
}
