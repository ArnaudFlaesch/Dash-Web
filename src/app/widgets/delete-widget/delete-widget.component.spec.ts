import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DeleteWidgetComponent } from './delete-widget.component';

describe('DeleteWidgetComponent', () => {
  let spectator: Spectator<DeleteWidgetComponent>;

  const createComponent = createComponentFactory({
    component: DeleteWidgetComponent
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('Dummy test', () => {
    expect(spectator.component).toBeTruthy();
  });
});
