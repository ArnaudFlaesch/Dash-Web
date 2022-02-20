import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { TabComponent } from './tab.component';

describe('TabComponent', () => {
  let spectator: Spectator<TabComponent>;
  const createComponent = createComponentFactory({
    component: TabComponent
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create the app', () => {
    expect(spectator.component).toBeTruthy();
  });
});
