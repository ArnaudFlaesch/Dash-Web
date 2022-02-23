import { TabService } from './../services/tab.service/tab.service';
import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator';
import { TabComponent } from './tab.component';

describe('TabComponent', () => {
  let spectator: Spectator<TabComponent>;
  let tabService: SpectatorHttp<TabService>;

  const createComponent = createComponentFactory({
    component: TabComponent
  });
  const createHttp = createHttpFactory(TabService);

  beforeEach(() => (spectator = createComponent()));

  it('Dummy test', () => {
    expect(true).toEqual(true);
  });
});
