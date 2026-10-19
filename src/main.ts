import { registerLocaleData } from "@angular/common";
import { provideHttpClient, withInterceptors, withXhr } from "@angular/common/http";
import localeFr from "@angular/common/locales/fr";
import { inject, isDevMode, LOCALE_ID } from "@angular/core";
import { provideDateFnsAdapter } from "@angular/material-date-fns-adapter";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, Routes } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { DateAdapter, provideCalendar } from "angular-calendar";
import { adapterFactory } from "angular-calendar/date-adapters/date-fns";
import { fr } from "date-fns/locale";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";
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
    { provide: MAT_DATE_LOCALE, useValue: fr },
    { provide: LOCALE_ID, useValue: "fr-FR" },
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    provideDateFnsAdapter(),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor]))
  ]
}).catch((err) => console.error(err));
