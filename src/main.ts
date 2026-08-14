import { inject, isDevMode, LOCALE_ID } from "@angular/core";

import { registerLocaleData } from "@angular/common";
import localeFr from "@angular/common/locales/fr";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { provideDateFnsAdapter } from "@angular/material-date-fns-adapter";
import { MAT_DATE_LOCALE } from "@angular/material/core";
import { provideRouter, Routes } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { DateAdapter, provideCalendar } from "angular-calendar";
import { adapterFactory } from "angular-calendar/date-adapters/date-fns";
import { fr } from "date-fns/locale";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";
import { AuthService } from "./app/services/auth.service/auth.service";
import { ConfigService } from "./app/services/config.service/config.service";
import { DateUtilsService } from "./app/services/date.utils.service/date.utils.service";
import { ErrorHandlerService } from "./app/services/error.handler.service";
import { NotificationService } from "./app/services/notification.service/NotificationService";
import { TabService } from "./app/services/tab.service/tab.service";
import { MiniWidgetService } from "./app/services/widget.service/miniwidget.service";
import { WidgetService } from "./app/services/widget.service/widget.service";
import { AirParifWidgetService } from "./app/widgets/airparif-widget/airparif-widget.service";
import { CalendarWidgetService } from "./app/widgets/calendar-widget/calendar-widget.service";
import { IncidentWidgetService } from "./app/widgets/incident-widget/incident.widget.service";
import { RssWidgetService } from "./app/widgets/rss-widget/rss.widget.service";
import { SteamWidgetService } from "./app/widgets/steam-widget/steam.widget.service";
import { StravaWidgetService } from "./app/widgets/strava-widget/strava.widget.service";
import { WeatherWidgetService } from "./app/widgets/weather-widget/weather.widget.service";
import { WorkoutWidgetService } from "./app/widgets/workout-widget/workout.widget.service";
import { ThemeService } from "./app/services/theme.service/theme.service";

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
    AuthService,
    TabService,
    WidgetService,
    MiniWidgetService,
    ConfigService,
    RssWidgetService,
    WeatherWidgetService,
    ErrorHandlerService,
    DateUtilsService,
    SteamWidgetService,
    AirParifWidgetService,
    WorkoutWidgetService,
    CalendarWidgetService,
    StravaWidgetService,
    NotificationService,
    IncidentWidgetService,
    ThemeService,
    { provide: MAT_DATE_LOCALE, useValue: fr },
    { provide: LOCALE_ID, useValue: "fr-FR" },
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
    provideDateFnsAdapter(),
    provideHttpClient(withInterceptorsFromDi())
  ]
}).catch((err) => console.error(err));
