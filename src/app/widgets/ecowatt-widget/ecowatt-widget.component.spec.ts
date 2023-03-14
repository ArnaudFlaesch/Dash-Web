import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';

import { EcowattWidgetComponent } from './ecowatt-widget.component';

describe('EcowattWidgetComponent', () => {
  let spectator: Spectator<EcowattWidgetComponent>;

  const createComponent = createComponentFactory({
    component: EcowattWidgetComponent
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    spectator.component.refreshWidget();
    expect(spectator.component.getWidgetData()).toEqual({});
  });
});
