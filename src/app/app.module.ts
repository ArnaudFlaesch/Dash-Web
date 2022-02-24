import { DateUtilsService } from './utils/date.utils';
import { WeatherWidgetService } from './widgets/weather-widget/weather.widget.service';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ErrorComponent } from './error/error.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { AuthService } from './services/auth.service/auth.service';
import { TabService } from './services/tab.service/tab.service';
import { WidgetService } from './services/widget.service/widget.service';
import { TabComponent } from './tab/tab.component';
import { DeleteWidgetComponent } from './widgets/delete-widget/delete-widget.component';
import { RssWidgetComponent } from './widgets/rss-widget/rss-widget.component';
import { RssWidgetService } from './widgets/rss-widget/rss.widget.service';
import { WeatherWidgetComponent } from './widgets/weather-widget/weather-widget.component';
import { WidgetListComponent } from './widgets/widget-list/widget-list.component';
import { WidgetComponent } from './widgets/widget/widget.component';
import { NgChartsModule } from 'ng2-charts';

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
    WidgetListComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTabsModule,
    MatExpansionModule,
    NgChartsModule
  ],
  providers: [
    AuthService,
    TabService,
    WidgetService,
    RssWidgetService,
    WeatherWidgetService,
    DateUtilsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
