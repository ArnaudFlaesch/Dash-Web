import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { forkJoin } from 'rxjs';
import { SafePipe } from '../../pipes/safe.pipe';
import { WidgetComponent } from '../widget/widget.component';
import { ErrorHandlerService } from './../../services/error.handler.service';
import { AirParifMapComponent } from './airparif-map/airparif-map.component';
import { AirParifWidgetService } from './airparif-widget.service';
import { IAirParifCouleur, IForecast } from './model/IAirParif';

@Component({
  selector: 'dash-airparif-widget',
  templateUrl: './airparif-widget.component.html',
  styleUrls: ['./airparif-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  public airParifApiKey?: string;
  public communeInseeCode?: string;

  public airParifCouleursIndices: IAirParifCouleur[] = [];
  public airParifForecast: IForecast[] = [];
  public forecastToDisplay: IForecast | undefined;

  public isWidgetLoaded = true;

  private ERROR_GETTING_AIRPARIF_FORECAST =
    "Erreur lors de la récupération des prévisions d'AirParif.";

  private airParifWidgetService = inject(AirParifWidgetService);
  private errorHandlerService = inject(ErrorHandlerService);
  public airParifWebsiteUrl = this.airParifWidgetService.getAirParifWebsiteUrl();

  public refreshWidget(): void {
    if (this.airParifApiKey && this.communeInseeCode) {
      forkJoin([
        this.airParifWidgetService.getCommunePrevision(this.communeInseeCode),
        this.airParifWidgetService.getColors()
      ]).subscribe({
        next: ([forecast, airParifColors]) => {
          this.airParifForecast = forecast;
          this.airParifCouleursIndices = airParifColors;
        },
        error: (error) =>
          this.errorHandlerService.handleError(error, this.ERROR_GETTING_AIRPARIF_FORECAST)
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
