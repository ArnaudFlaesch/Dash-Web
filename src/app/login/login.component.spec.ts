import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { AuthService } from '../services/auth.service/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let spectator: Spectator<LoginComponent>;
  const createComponent = createComponentFactory({
    component: LoginComponent,
    imports: [HttpClientModule, FormsModule, MatSnackBarModule],
    providers: [AuthService]
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create the app', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('Should display the title', () => {
    spectator.fixture.detectChanges();
    expect(spectator.query('h1')?.textContent).toEqual('Dash');
  });
});
