import { CalendarWidgetService } from './calendar-widget.service';
import { DateAdapter } from 'angular-calendar';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarWidgetComponent } from './calendar-widget.component';
import {
  Spectator,
  SpectatorHttp,
  createComponentFactory,
  createHttpFactory
} from '@ngneat/spectator';

describe('CalendarWidgetComponent', () => {
  let spectator: Spectator<CalendarWidgetComponent>;
  let calendarWidgetService: SpectatorHttp<CalendarWidgetService>;

  const createComponent = createComponentFactory({
    component: CalendarWidgetComponent,
    providers: [CalendarWidgetService, DateAdapter]
  });
  const createHttpRssWidgetService = createHttpFactory(CalendarWidgetService);

  beforeEach(() => {
    spectator = createComponent();
    calendarWidgetService = createHttpRssWidgetService();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
