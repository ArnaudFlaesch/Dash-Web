import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CreateMiniWidgetModalComponent } from './create-mini-widget-modal.component';

describe('CreateMiniWidgetModalComponent', () => {
  let spectator: Spectator<CreateMiniWidgetModalComponent>;

  const createComponent = createComponentFactory({
    component: CreateMiniWidgetModalComponent,
    providers: [{ provide: MatDialogRef, useValue: {} }]
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('Should create the component', () => {
    expect(spectator.component).toBeTruthy();
  });
});
