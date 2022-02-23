import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator';
import { environment } from '../../../environments/environment';
import { RssWidgetComponent } from './rss-widget.component';
import { RssWidgetService } from './rss.widget.service';

describe('RssWidgetComponent', () => {
  let spectator: Spectator<RssWidgetComponent>;
  let rssWidgetService: SpectatorHttp<RssWidgetService>;

  const createComponent = createComponentFactory({
    component: RssWidgetComponent,
    providers: [RssWidgetService]
  });
  const createHttp = createHttpFactory(RssWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    rssWidgetService = createHttp();
  });

  it('Dummy test', () => {
    expect(true).toBeTruthy();
    rssWidgetService.expectOne(
      environment.backend_url + '/proxy/?url=' + spectator.component.urlFeed,
      HttpMethod.GET
    );
  });
});
