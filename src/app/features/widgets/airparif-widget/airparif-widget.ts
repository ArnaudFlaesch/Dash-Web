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

  protected readonly config = signal({
    airParifApiKey: injectWidgetData("airParifApiKey", ""),
    communeInseeCode: injectWidgetData("communeInseeCode", "")
  });
  protected readonly configForm = form(this.config, (path) => {
    requiredText(path.airParifApiKey);
    requiredText(path.communeInseeCode);
    // 5 characters, the second one being A or B for Corsica
    pattern(path.communeInseeCode, /^\s*\d[\dAB]\d{3}\s*$/i);
  });

  /** Forecast of the commune saved on the last refresh, with the colors of the indices. */
  protected readonly airParifResource = rxResource({
    params: () => this.refreshedCommune(),
    stream: ({ params: { communeInseeCode } }) =>
      forkJoin([
        this.airParifWidgetService.getCommunePrevision(communeInseeCode),
        this.airParifWidgetService.getColors()
      ]).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_AIRPARIF_FORECAST);
          return of<[AirparifForecast[], AirparifCouleur[]]>([[], []]);
        })
      ),
    defaultValue: [[], []] as [AirparifForecast[], AirparifCouleur[]]
  });

  protected readonly airParifForecast = computed(() => this.airParifResource.value()[0]);
  protected readonly airParifCouleursIndices = computed(() => this.airParifResource.value()[1]);
  protected readonly isWidgetLoaded = signal(true);

  protected readonly isFormValid = computed(() => this.configForm().valid());
  protected readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));

  protected readonly airParifWebsiteUrl = inject(AirparifWidgetService).AIRPARIF_WEBSITE_URL;
  public readonly airParifMap = viewChild(AirparifMap);

  // A new object on each refresh, so that the resource reloads even if the commune is unchanged
  private readonly refreshedCommune = signal<{ communeInseeCode: string } | undefined>(undefined);

  private readonly ERROR_GETTING_AIRPARIF_FORECAST =
    "Erreur lors de la récupération des prévisions d'Airparif.";
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly airParifWidgetService = inject(AirparifWidgetService);

  protected refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshedCommune.set({ communeInseeCode: this.config().communeInseeCode });
    }
  }

  protected getIndiceClass(indice: AirparifIndice): string {
    return this.airParifWidgetService.getIndiceClass(indice);
  }

  protected getIndiceLabel(indice: AirparifIndice): string {
    return this.airParifWidgetService.getIndiceLabel(indice);
  }

  protected openSidebar(): void {
    this.airParifMap()?.openSidebar();
  }
}
