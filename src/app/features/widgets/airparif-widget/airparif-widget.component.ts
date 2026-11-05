import { HttpErrorResponse } from "@angular/common/http";
import { Component, computed, inject, signal, viewChild } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { MatFormField, MatHint, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatTooltip } from "@angular/material/tooltip";
import { catchError, forkJoin, of } from "rxjs";
import { WidgetComponent } from "@widgets/widget/widget.component";
import { injectWidgetData } from "@widgets/widget.tokens";
import { ErrorHandlerService } from "@core/error-handler/error-handler.service";
import { AirParifMapComponent } from "./airparif-map/airparif-map.component";
import { AirParifWidgetService } from "./airparif-widget.service";
import { AirParifIndiceEnum, IAirParifCouleur, IForecast } from "./airparif.model";
import { form, FormField, pattern } from "@angular/forms/signals";
import { requiredText } from "@shared/utils/form-validators";

@Component({
  selector: "dash-airparif-widget",
  templateUrl: "./airparif-widget.component.html",
  styleUrl: "./airparif-widget.component.scss",
  imports: [
    WidgetComponent,
    MatIcon,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    MatTooltip,
    AirParifMapComponent,
    FormField
  ]
})
export class AirParifWidgetComponent {
  public readonly labels = {
    title: "AirParif",
    seeAirQualityDetails: "Voir le détail de la qualité de l'air",
    apiKey: "Clé d'API",
    apiKeyPlaceholder: "Saisissez la clé d'API AirParif",
    communeCode: "Code commune",
    communeCodePlaceholder: "Saisissez le code commune",
    communeCodeHint: "Code INSEE à 5 chiffres, par exemple 75112 pour Paris 12e"
  };

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

  /** Forecast of the commune saved on the last refresh, with the colors of the indices. */
  public readonly airParifResource = rxResource({
    params: () => this.refreshedCommune(),
    stream: ({ params: { communeInseeCode } }) =>
      forkJoin([
        this.airParifWidgetService.getCommunePrevision(communeInseeCode),
        this.airParifWidgetService.getColors()
      ]).pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_AIRPARIF_FORECAST);
          return of<[IForecast[], IAirParifCouleur[]]>([[], []]);
        })
      ),
    defaultValue: [[], []] as [IForecast[], IAirParifCouleur[]]
  });

  public readonly airParifForecast = computed(() => this.airParifResource.value()[0]);
  public readonly airParifCouleursIndices = computed(() => this.airParifResource.value()[1]);
  public readonly isWidgetLoaded = signal(true);

  public readonly isFormValid = computed(() => this.configForm().valid());
  public readonly widgetData = computed(() => (this.isFormValid() ? this.config() : undefined));

  public readonly airParifWebsiteUrl = inject(AirParifWidgetService).AIRPARIF_WEBSITE_URL;
  public readonly airParifMap = viewChild(AirParifMapComponent);

  // A new object on each refresh, so that the resource reloads even if the commune is unchanged
  private readonly refreshedCommune = signal<{ communeInseeCode: string } | undefined>(undefined);

  private readonly ERROR_GETTING_AIRPARIF_FORECAST =
    "Erreur lors de la récupération des prévisions d'AirParif.";
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly airParifWidgetService = inject(AirParifWidgetService);

  public refreshWidget(): void {
    if (this.isFormValid()) {
      this.refreshedCommune.set({ communeInseeCode: this.config().communeInseeCode });
    }
  }

  public getIndiceClass(indice: AirParifIndiceEnum): string {
    return this.airParifWidgetService.getIndiceClass(indice);
  }

  public getIndiceLabel(indice: AirParifIndiceEnum): string {
    return this.airParifWidgetService.getIndiceLabel(indice);
  }

  public openSidebar(): void {
    this.airParifMap()?.openSidebar();
  }
}
