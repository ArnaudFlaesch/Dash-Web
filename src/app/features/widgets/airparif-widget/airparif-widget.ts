import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal, viewChild } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { MatFormField, MatHint, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatTooltip } from "@angular/material/tooltip";
import { catchError, forkJoin, of } from "rxjs";
import { Widget } from "@widgets/widget/widget";
import { injectWidgetData } from "@widgets/widget-tokens";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { AirparifMap } from "./airparif-map/airparif-map";
import { AirparifWidgetService } from "./airparif-widget-service";
import { AirparifIndice, AirparifCouleur, AirparifForecast } from "./airparif";
import { form, FormField, pattern } from "@angular/forms/signals";
import { requiredText } from "@shared/forms/form-validators";

@Component({
  selector: "dash-airparif-widget",
  templateUrl: "./airparif-widget.html",
  styleUrl: "./airparif-widget.scss",
  imports: [
    Widget,
    MatIcon,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatTooltip,
    AirparifMap,
    FormField
  ]
})
export class AirparifWidget {
  protected readonly labels = {
    title: "Airparif",
    seeAirQualityDetails: "Voir le détail de la qualité de l'air",
    apiKey: "Clé d'API",
    apiKeyPlaceholder: "Saisissez la clé d'API Airparif",
    communeCode: "Code commune",
    communeCodePlaceholder: "Saisissez le code commune",
    communeCodeHint: "Code INSEE à 5 chiffres, par exemple 75112 pour Paris 12e"
  };

  private readonly ERROR_MESSAGES = {
    gettingAirparifForecast: "Erreur lors de la récupération des prévisions d'Airparif."
  };

  private readonly airParifMap = viewChild(AirparifMap);

  public readonly config = signal({
    airParifApiKey: injectWidgetData("airParifApiKey", ""),
    communeInseeCode: injectWidgetData("communeInseeCode", "")
  });
  public readonly configForm = form(this.config, (path) => {
    requiredText(path.airParifApiKey);
    requiredText(path.communeInseeCode);
    // 5 characters, the second one being A or B for Corsica
    pattern(path.communeInseeCode, /^\s*\d[\dAB]\d{3}\s*$/i);
  });
  public readonly isWidgetLoaded = signal(true);
  // A new object on each refresh, so that the resource reloads even if the commune is unchanged
  private readonly refreshedCommune = signal<{ communeInseeCode: string } | undefined>(undefined);

  /** Forecast of the commune saved on the last refresh, with the colors of the indices. */
  public readonly airParifResource = rxResource({
    params: () => this.refreshedCommune(),
    stream: ({ params: { communeInseeCode } }) =>
      forkJoin([
        this.airParifWidgetService.getCommunePrevision(communeInseeCode),
        this.airParifWidgetService.getColors()
      ]).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.gettingAirparifForecast);
          return of<[AirparifForecast[], AirparifCouleur[]]>([[], []]);
        })
      ),
    defaultValue: [[], []] as [AirparifForecast[], AirparifCouleur[]]
  });

  public readonly airParifForecast = computed(() => this.airParifResource.value()[0]);
  public readonly airParifCouleursIndices = computed(() => this.airParifResource.value()[1]);
  public readonly isFormValid = computed(() => this.configForm().valid());
  public readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));

  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly airParifWidgetService = inject(AirparifWidgetService);
  public readonly airParifWebsiteUrl = this.airParifWidgetService.AIRPARIF_WEBSITE_URL;
  // Configuration of the last refresh, restored when the edition is cancelled
  private savedConfig = this.config();

  public refreshWidget(): void {
    if (this.isFormValid()) {
      this.savedConfig = this.config();
      // The pattern allows surrounding spaces and lowercase Corsican codes (2a / 2b)
      this.refreshedCommune.set({
        communeInseeCode: this.config().communeInseeCode.trim().toUpperCase()
      });
    }
  }

  public restoreSavedConfig(): void {
    this.config.set(this.savedConfig);
  }

  public getIndiceClass(indice: AirparifIndice): string {
    return this.airParifWidgetService.getIndiceClass(indice);
  }

  public getIndiceLabel(indice: AirparifIndice): string {
    return this.airParifWidgetService.getIndiceLabel(indice);
  }

  public openSidebar(): void {
    this.airParifMap()?.openSidebar();
  }
}
