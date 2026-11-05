import { provideHttpClient, withInterceptors, withXhr } from "@angular/common/http";
import { ApplicationConfig, isDevMode, LOCALE_ID } from "@angular/core";
import { provideDateFnsAdapter } from "@angular/material-date-fns-adapter";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from "@angular/material/dialog";
import { provideRouter } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { DateAdapter, provideCalendar } from "angular-calendar";
import { adapterFactory } from "angular-calendar/date-adapters/date-fns";
import { fr } from "date-fns/locale";
import {
  BarController,
  BarElement,
  CategoryScale,
  Colors,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip
} from "chart.js";
import { provideCharts } from "ng2-charts";
import { authInterceptor } from "@core/auth/auth.interceptor";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideCalendar({ provide: DateAdapter, useFactory: adapterFactory }),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000"
    }),
    // Dialogs never overflow small screens (Material sets the max width as an inline style)
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        ...new MatDialogConfig(),
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100dvh - 2rem)"
      }
    },
    { provide: MAT_DATE_LOCALE, useValue: fr },
    { provide: LOCALE_ID, useValue: "fr-FR" },
    provideRouter(routes),
    // Only the bar (Strava) and line (workout statistics) charts are used
    provideCharts({
      registerables: [
        BarController,
        BarElement,
        LineController,
        LineElement,
        PointElement,
        CategoryScale,
        LinearScale,
        Colors,
        Legend,
        Tooltip
      ]
    }),
    provideDateFnsAdapter(),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor]))
  ]
};
