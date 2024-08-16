import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ErrorHandlerService } from './../../services/error.handler.service';
import { AirParifWidgetService } from './airparif-widget.service';
import { IAirParifCouleur, IForecast } from './model/IAirParif';
import { SafePipe } from '../../pipes/safe.pipe';
import { AirParifMapComponent } from './airparif-map/airparif-map.component';
import { FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { WidgetComponent } from '../widget/widget.component';

@Component({
  selector: 'dash-airparif-widget',
  templateUrl: './airparif-widget.component.html',
  styleUrls: ['./airparif-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [
    WidgetComponent,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    AirParifMapComponent,
    SafePipe
  ]
})
export class AirParifWidgetComponent {
  private airParifWidgetService = inject(AirParifWidgetService);
  private errorHandlerService = inject(ErrorHandlerService);

  public airParifApiKey?: string;
  public communeInseeCode?: string;

  public airParifCouleursIndices: IAirParifCouleur[] = [];
  public airParifForecast: IForecast[] = [];
  public forecastToDisplay: IForecast | undefined;

  public isWidgetLoaded = true;

  public airParifWebsiteUrl = this.airParifWidgetService.getAirParifWebsiteUrl();

  private ERROR_GETTING_AIRPARIF_FORECAST =
    "Erreur lors de la récupération des prévisions d'AirParif.";
  private ERROR_GETTING_AIRPARIF_COLOR_INDICES =
    "Erreur lors de la récupération des couleurs d'indices d'AirParif.";

  public refreshWidget(): void {
    if (this.airParifApiKey && this.communeInseeCode) {
      this.airParifWidgetService.getCommunePrevision(this.communeInseeCode).subscribe({
        next: (forecast) => {
          this.airParifForecast = forecast;
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_AIRPARIF_FORECAST)
      });

      this.airParifWidgetService.getColors().subscribe({
        next: (airParifColors) => (this.airParifCouleursIndices = airParifColors),
        error: (error) =>
          this.errorHandlerService.handleError(
            error.message,
            this.ERROR_GETTING_AIRPARIF_COLOR_INDICES
          )
      });
    }
  }

  public isFormValid(): boolean {
    return (this.airParifApiKey ?? '').length > 0 && (this.communeInseeCode ?? '').length > 0;
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
