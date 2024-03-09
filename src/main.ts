import { enableProdMode, LOCALE_ID, isDevMode, importProvidersFrom } from '@angular/core';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { MatDateFnsModule } from '@angular/material-date-fns-adapter';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { AppRoutingModule } from './app/app-routing.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { fr } from 'date-fns/locale/fr';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { ThemeService } from './app/services/theme.service/theme.service';
import { IncidentWidgetService } from './app/widgets/incident-widget/incident.widget.service';
import { NotificationService } from './app/services/notification.service/NotificationService';
import { StravaWidgetService } from './app/widgets/strava-widget/strava.widget.service';
import { CalendarWidgetService } from './app/widgets/calendar-widget/calendar-widget.service';
import { WorkoutWidgetService } from './app/widgets/workout-widget/workout.widget.service';
import { AirParifWidgetService } from './app/widgets/airparif-widget/airparif-widget.service';
import { SteamWidgetService } from './app/widgets/steam-widget/steam.widget.service';
import { DateUtilsService } from './app/services/date.utils.service/date.utils.service';
import { ErrorHandlerService } from './app/services/error.handler.service';
import { WeatherWidgetService } from './app/widgets/weather-widget/weather.widget.service';
import { RssWidgetService } from './app/widgets/rss-widget/rss.widget.service';
import { ConfigService } from './app/services/config.service/config.service';
import { MiniWidgetService } from './app/services/widget.service/miniwidget.service';
import { WidgetService } from './app/services/widget.service/widget.service';
import { TabService } from './app/services/tab.service/tab.service';
import { AuthService } from './app/services/auth.service/auth.service';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

if (environment.production) {
  enableProdMode();
}

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
    provideCharts(withDefaultRegisterables()),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi())
  ]
}).catch((err) => console.error(err));
