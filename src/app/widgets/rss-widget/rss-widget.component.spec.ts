import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { environment } from '../../../environments/environment';
import { RssWidgetComponent } from './rss-widget.component';
import { RssWidgetService } from './rss.widget.service';

describe('RssWidgetComponent', () => {
  let spectator: Spectator<RssWidgetComponent>;
  let rssWidgetService: SpectatorHttp<RssWidgetService>;

  const urlFeed = 'https://www.jeuxvideo.com/rss/rss-pc.xml';

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
    spectator.component.urlFeed = urlFeed;
    spectator.component.refreshWidget();
    rssWidgetService.expectOne(
      environment.backend_url + '/rssWidget/?url=' + urlFeed,
      HttpMethod.GET
    );
  });
});
