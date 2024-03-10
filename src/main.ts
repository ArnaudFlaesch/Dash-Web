import { LOCALE_ID, enableProdMode, importProvidersFrom, inject, isDevMode } from '@angular/core';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDateFnsModule, provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { fr } from 'date-fns/locale/fr';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { AuthService } from './app/services/auth.service/auth.service';
import { ConfigService } from './app/services/config.service/config.service';
import { DateUtilsService } from './app/services/date.utils.service/date.utils.service';
import { ErrorHandlerService } from './app/services/error.handler.service';
import { NotificationService } from './app/services/notification.service/NotificationService';
import { TabService } from './app/services/tab.service/tab.service';
import { ThemeService } from './app/services/theme.service/theme.service';
import { MiniWidgetService } from './app/services/widget.service/miniwidget.service';
import { WidgetService } from './app/services/widget.service/widget.service';
import { AirParifWidgetService } from './app/widgets/airparif-widget/airparif-widget.service';
import { CalendarWidgetService } from './app/widgets/calendar-widget/calendar-widget.service';
import { IncidentWidgetService } from './app/widgets/incident-widget/incident.widget.service';
import { RssWidgetService } from './app/widgets/rss-widget/rss.widget.service';
import { SteamWidgetService } from './app/widgets/steam-widget/steam.widget.service';
import { StravaWidgetService } from './app/widgets/strava-widget/strava.widget.service';
import { WeatherWidgetService } from './app/widgets/weather-widget/weather.widget.service';
import { WorkoutWidgetService } from './app/widgets/workout-widget/workout.widget.service';
import { environment } from './environments/environment';
import { ROUTES, Routes, provideRoutes } from '@angular/router';
import { HomeComponent } from './app/home/home.component';
import { LoginComponent } from './app/login/login.component';

if (environment.production) {
  enableProdMode();
}

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [() => inject(AuthService).userHasValidToken()]
  },
  { path: '**', redirectTo: 'home' }
];

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      DragDropModule,
      AppRoutingModule,
      MatProgressSpinnerModule,
      MatSnackBarModule,
      FormsModule,
      MatButtonModule,
      MatDatepickerModule,
      MatDividerModule,
      MatNativeDateModule,
      MatIconModule,
      MatInputModule,
      MatBadgeModule,
      MatTooltipModule,
      MatMenuModule,
      MatFormFieldModule,
      MatSnackBarModule,
      MatTabsModule,
      MatSlideToggleModule,
      MatExpansionModule,
      MatDialogModule,
      MatCardModule,
      MatToolbarModule,
      MatPaginatorModule,
      MatDateFnsModule,
      ReactiveFormsModule,
      CalendarModule.forRoot({
        provide: DateAdapter,
        useFactory: adapterFactory
      }),
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000'
      })
    ),
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
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    { provide: ROUTES, useValue: routes },
    provideCharts(withDefaultRegisterables()),
    provideDateFnsAdapter(),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi())
  ]
}).catch((err) => console.error(err));
