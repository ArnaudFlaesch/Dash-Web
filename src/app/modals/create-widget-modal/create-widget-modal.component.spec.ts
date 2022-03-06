import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CreateWidgetModalComponent } from './create-widget-modal.component';

describe('CreateWidgetModalComponent', () => {
  let spectator: Spectator<CreateWidgetModalComponent>;

  const createComponent = createComponentFactory({
    component: CreateWidgetModalComponent,
    providers: [{ provide: MatDialogRef, useValue: {} }]
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('Dummy test', () => {
    expect(true).toBeTruthy();
  });
});
