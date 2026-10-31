import { registerLocaleData } from "@angular/common";
import { provideHttpClient, withInterceptors, withXhr } from "@angular/common/http";
import localeFr from "@angular/common/locales/fr";
import { inject, isDevMode, LOCALE_ID } from "@angular/core";
import { provideDateFnsAdapter } from "@angular/material-date-fns-adapter";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from "@angular/material/dialog";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, Routes } from "@angular/router";
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
import { AppComponent } from "./app/app.component";
import { AuthService } from "./app/services/auth.service/auth.service";
import { authInterceptor } from "./app/services/auth.interceptor/auth.interceptor";

registerLocaleData(localeFr);

const routes: Routes = [
  {
    path: "login",
    loadComponent: () => import("./app/login/login.component").then((m) => m.LoginComponent)
  },
  {
    path: "home",
    loadComponent: () => import("./app/home/home.component").then((m) => m.HomeComponent),
    canActivate: [(): boolean => inject(AuthService).userHasValidToken()]
  },
  { path: "**", redirectTo: "home" }
];

bootstrapApplication(AppComponent, {
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
}).catch((err) => console.error(err));
