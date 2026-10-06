import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  WritableSignal
} from "@angular/core";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { forkJoin } from "rxjs";
import { SafePipe } from "../../pipes/safe.pipe";
import { WidgetComponent } from "../widget/widget.component";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { AirParifMapComponent } from "./airparif-map/airparif-map.component";
import { AirParifWidgetService } from "./airparif-widget.service";
import { IAirParifCouleur, IForecast } from "./model/IAirParif";
import { FormField, form } from "@angular/forms/signals";

@Component({
  selector: "dash-airparif-widget",
  templateUrl: "./airparif-widget.component.html",
  styleUrls: ["./airparif-widget.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  public airParifApiKey = signal<string>("");
  public communeInseeCode = signal<string>("");
  public airParifApiKeyForm = form(this.airParifApiKey);
  public communeInseeCodeForm = form(this.communeInseeCode);
  public airParifCouleursIndices: WritableSignal<IAirParifCouleur[]> = signal([]);
  public airParifForecast: WritableSignal<IForecast[]> = signal([]);
  public isWidgetLoaded = signal(true);

  public readonly isFormValid = computed(
    () => this.airParifApiKey().trim().length > 0 && this.communeInseeCode().trim().length > 0
  );

  public readonly airParifWidgetService = inject(AirParifWidgetService);

  private readonly ERROR_GETTING_AIRPARIF_FORECAST =
    "Erreur lors de la récupération des prévisions d'AirParif.";
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public refreshWidget(): void {
    const apiKey = this.airParifApiKey();
    const inseeCode = this.communeInseeCode();
    if (apiKey && inseeCode) {
      forkJoin([
        this.airParifWidgetService.getCommunePrevision(inseeCode),
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

  public getWidgetData():
    | {
        airParifApiKey: string;
        communeInseeCode: string;
      }
    | undefined {
    const apiKey = this.airParifApiKey();
    const inseeCode = this.communeInseeCode();
    return apiKey && inseeCode
      ? {
          airParifApiKey: apiKey,
          communeInseeCode: inseeCode
        }
      : undefined;
  }
}
