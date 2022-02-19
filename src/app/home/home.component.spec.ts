import { MatSnackBarModule } from '@angular/material/snack-bar';
import { TabService } from './../services/tab.service/tab.service';
import { AuthService } from './../services/auth.service/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { HomeComponent } from './home.component';
import { HttpClientModule } from '@angular/common/http';

describe('HomeComponent', () => {
  let spectator: Spectator<HomeComponent>;
  const createComponent = createComponentFactory({
    component: HomeComponent,
    imports: [HttpClientModule, MatSnackBarModule, RouterTestingModule],
    providers: [AuthService, TabService]
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create the app', () => {
    expect(spectator.component).toBeTruthy();
  });
});
