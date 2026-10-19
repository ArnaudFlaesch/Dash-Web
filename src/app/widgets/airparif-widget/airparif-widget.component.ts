import { Component, computed, inject, signal } from "@angular/core";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { forkJoin } from "rxjs";
import { SafePipe } from "../../pipes/safe.pipe";
import { WidgetComponent } from "../widget/widget.component";
import { injectWidgetData } from "../widget.tokens";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { AirParifMapComponent } from "./airparif-map/airparif-map.component";
import { AirParifWidgetService } from "./airparif-widget.service";
import { IAirParifCouleur, IForecast } from "./model/IAirParif";
import { form, FormField } from "@angular/forms/signals";
import { requiredText } from "../../utils/form-validators";

@Component({
  selector: "dash-airparif-widget",
  templateUrl: "./airparif-widget.component.html",
  imports: [
    WidgetComponent,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    AirParifMapComponent,
    SafePipe,
    FormField
  ]
})
export class AirParifWidgetComponent {
  public readonly config = signal({
    airParifApiKey: injectWidgetData("airParifApiKey", ""),
    communeInseeCode: injectWidgetData("communeInseeCode", "")
  });
  public readonly configForm = form(this.config, (path) => {
    requiredText(path.airParifApiKey);
    requiredText(path.communeInseeCode);
  });
  public readonly airParifCouleursIndices = signal<IAirParifCouleur[]>([]);
  public readonly airParifForecast = signal<IForecast[]>([]);
  public readonly isWidgetLoaded = signal(true);

  public readonly isFormValid = computed(() => this.configForm().valid());

  public readonly airParifWidgetService = inject(AirParifWidgetService);

  private readonly ERROR_GETTING_AIRPARIF_FORECAST =
    "Erreur lors de la récupération des prévisions d'AirParif.";
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public refreshWidget(): void {
    if (this.isFormValid()) {
      forkJoin([
        this.airParifWidgetService.getCommunePrevision(this.config().communeInseeCode),
        this.airParifWidgetService.getColors()
      ]).subscribe({
        next: ([forecast, airParifColors]) => {
          this.airParifForecast.set(forecast);
          this.airParifCouleursIndices.set(airParifColors);
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_AIRPARIF_FORECAST)
      });
    }
  }

  public getWidgetData(): { airParifApiKey: string; communeInseeCode: string } | undefined {
    return this.isFormValid() ? this.config() : undefined;
  }
}
