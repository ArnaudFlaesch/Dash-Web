import { DateUtilsService } from './../../utils/date.utils';
import { ErrorHandlerService } from './../../services/error.handler.service';
import { WidgetService } from './../../services/widget.service/widget.service';
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
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('RssWidgetComponent', () => {
  let spectator: Spectator<RssWidgetComponent>;
  let rssWidgetService: SpectatorHttp<RssWidgetService>;

  const urlFeed = 'https://www.jeuxvideo.com/rss/rss-pc.xml';

  const createComponent = createComponentFactory({
    component: RssWidgetComponent,
    imports: [MatSnackBarModule],
    providers: [
      RssWidgetService,
      DateUtilsService,
      WidgetService,
      ErrorHandlerService,
      { provide: 'widgetId', useValue: '37' }
    ]
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
