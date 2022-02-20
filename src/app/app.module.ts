import { TabService } from './services/tab.service/tab.service';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { ErrorComponent } from './error/error.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TabComponent } from './tab/tab.component';
import { AuthService } from './services/auth.service/auth.service';
@NgModule({
  declarations: [AppComponent, LoginComponent, HomeComponent, ErrorComponent, TabComponent],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  providers: [AuthService, TabService],
  bootstrap: [AppComponent]
})
export class AppModule {}
