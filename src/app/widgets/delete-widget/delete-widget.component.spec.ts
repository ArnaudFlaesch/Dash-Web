import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';
import { WidgetService } from './../../services/widget.service/widget.service';
import { DeleteWidgetComponent } from './delete-widget.component';

describe('DeleteWidgetComponent', () => {
  let spectator: Spectator<DeleteWidgetComponent>;
  let widgetService: SpectatorHttp<WidgetService>;

  const createComponent = createComponentFactory({
    component: DeleteWidgetComponent,
    providers: [WidgetService]
  });
  const createHttp = createHttpFactory(WidgetService);

  beforeEach(() => {
    spectator = createComponent();
    widgetService = createHttp();
  });

  it('Dummy test', () => {
    expect(true).toBeTruthy();
  });
});
