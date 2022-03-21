import { MatDialogModule } from '@angular/material/dialog';
import {
  createComponentFactory,
  createHttpFactory,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator';
import { DateAdapter } from 'angular-calendar';
import { CalendarWidgetComponent } from './calendar-widget.component';
import { CalendarWidgetService } from './calendar-widget.service';

describe('CalendarWidgetComponent', () => {
  let spectator: Spectator<CalendarWidgetComponent>;
  let calendarWidgetService: SpectatorHttp<CalendarWidgetService>;

  const createComponent = createComponentFactory({
    component: CalendarWidgetComponent,
    imports: [MatDialogModule],
    providers: [CalendarWidgetService, DateAdapter]
  });
  const createHttpRssWidgetService = createHttpFactory(CalendarWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    calendarWidgetService = createHttpRssWidgetService();
  });

  it('should create', () => {
    expect(spectator.component.calendarUrls).toEqual([]);
  });
});
