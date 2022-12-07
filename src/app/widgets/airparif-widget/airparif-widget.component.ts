import { Component } from '@angular/core';

import { ErrorHandlerService } from './../../services/error.handler.service';
import { AirParifWidgetService } from './airparif-widget.service';
import { IAirParifCouleur, IForecast } from './model/IAirParif';

@Component({
  selector: 'app-airparif-widget',
  templateUrl: './airparif-widget.component.html',
  styleUrls: ['./airparif-widget.component.scss']
})
export class AirParifWidgetComponent {
  public airParifApiKey: string | undefined;
  public communeInseeCode: string | undefined;

  public airParifCouleursIndices: IAirParifCouleur[] = [];
  public airParifForecast: IForecast[] = [];
  public forecastToDisplay: IForecast | undefined;

  public isWidgetLoaded = true;

  public airParifWebsiteUrl =
    this.airParifWidgetService.getAirParifWebsiteUrl();

  private ERROR_GETTING_AIRPARIF_FORECAST =
    "Erreur lors de la récupération des prévisions d'AirParif.";
  private ERROR_GETTING_AIRPARIF_COLOR_INDICES =
    "Erreur lors de la récupération des couleurs d'indices d'AirParif.";

  constructor(
    private airParifWidgetService: AirParifWidgetService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  public refreshWidget(): void {
    if (this.airParifApiKey && this.communeInseeCode) {
      this.airParifWidgetService
        .getCommunePrevision(this.communeInseeCode)
        .subscribe({
          next: (forecast) => {
            this.airParifForecast = forecast;
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

  public isFormValid(): boolean {
    return (
      !!this.airParifApiKey &&
      this.airParifApiKey.length > 0 &&
      !!this.communeInseeCode &&
      this.communeInseeCode.length > 0
    );
  }

  public getWidgetData():
    | {
        airParifApiKey: string;
        communeInseeCode: string;
      }
    | undefined {
    return this.airParifApiKey && this.communeInseeCode
      ? {
          airParifApiKey: this.airParifApiKey,
          communeInseeCode: this.communeInseeCode
        }
      : undefined;
  }
}
