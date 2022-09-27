import { WorkoutWidgetService } from './widgets/workout-widget/workout.widget.service';
import { registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { NgChartsModule } from 'ng2-charts';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ErrorComponent } from './error/error.component';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { CreateWidgetModalComponent } from './modals/create-widget-modal/create-widget-modal.component';
import { ImportConfigModalComponent } from './modals/import-config-modal/import-config-modal.component';
import { SafePipe } from './pipes/safe.pipe';
import { DateFormatPipe } from './pipes/date-format.pipe';
import { AuthService } from './services/auth.service/auth.service';
import { ConfigService } from './services/config.service/config.service';
import { DateUtilsService } from './services/date.utils.service/date.utils.service';
import { ErrorHandlerService } from './services/error.handler.service';
import { TabService } from './services/tab.service/tab.service';
import { WidgetService } from './services/widget.service/widget.service';
import { TabComponent } from './tab/tab.component';
import { CalendarWidgetComponent } from './widgets/calendar-widget/calendar-widget.component';
import { CalendarWidgetService } from './widgets/calendar-widget/calendar-widget.service';
import { EventDetailModalComponent } from './widgets/calendar-widget/event-detail-modal/event-detail-modal.component';
import { DeleteWidgetComponent } from './widgets/delete-widget/delete-widget.component';
import { RssWidgetComponent } from './widgets/rss-widget/rss-widget.component';
import { RssWidgetService } from './widgets/rss-widget/rss.widget.service';
import { GameDetailsComponent } from './widgets/steam-widget/game-details/game-details.component';
import { SteamWidgetComponent } from './widgets/steam-widget/steam-widget.component';
import { SteamWidgetService } from './widgets/steam-widget/steam.widget.service';
import { StravaWidgetComponent } from './widgets/strava-widget/strava-widget.component';
import { StravaWidgetService } from './widgets/strava-widget/strava.widget.service';
import { WeatherWidgetComponent } from './widgets/weather-widget/weather-widget.component';
import { WeatherWidgetService } from './widgets/weather-widget/weather.widget.service';
import { WidgetListComponent } from './widgets/widget-list/widget-list.component';
import { WidgetComponent } from './widgets/widget/widget.component';
import { WorkoutWidgetComponent } from './widgets/workout-widget/workout-widget.component';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
registerLocaleData(localeFr);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    ErrorComponent,
    TabComponent,
    WidgetComponent,
    RssWidgetComponent,
    DeleteWidgetComponent,
    WeatherWidgetComponent,
    WidgetListComponent,
    StravaWidgetComponent,
    CalendarWidgetComponent,
    SteamWidgetComponent,
    GameDetailsComponent,
    DateFormatPipe,
    SafePipe,
    CreateWidgetModalComponent,
    ImportConfigModalComponent,
    EventDetailModalComponent,
    WorkoutWidgetComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatTabsModule,
    MatExpansionModule,
    MatDialogModule,
    MatCardModule,
    MatPaginatorModule,
    NgChartsModule,
    ReactiveFormsModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    })
  ],
  providers: [
    AuthService,
    TabService,
    WidgetService,
    ConfigService,
    RssWidgetService,
    WeatherWidgetService,
    ErrorHandlerService,
    DateUtilsService,
    SteamWidgetService,
    WorkoutWidgetService,
    CalendarWidgetService,
    StravaWidgetService,
    MatDatepickerModule,
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    AuthGuard,
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
