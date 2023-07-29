import { ConfirmModalComponent } from './confirm-modal.component';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('ConfirmModalComponent', () => {
  let spectator: Spectator<ConfirmModalComponent>;

  const createComponent = createComponentFactory({
    component: ConfirmModalComponent,
    imports: [],
    providers: [
      { provide: MatDialogRef, useValue: {} },
      { provide: MAT_DIALOG_DATA, useValue: { confirmMessage: 'test' } }
    ]
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('Should create the component', () => {
    expect(spectator.component).toBeTruthy();
  });
});
