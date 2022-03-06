import { WidgetService } from './../../services/widget.service/widget.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetListComponent } from './widget-list.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  Spectator,
  SpectatorHttp,
  createComponentFactory,
  createHttpFactory
} from '@ngneat/spectator/jest';

describe('WidgetListComponent', () => {
  let spectator: Spectator<WidgetListComponent>;
  let widgetService: SpectatorHttp<WidgetService>;

  const createComponent = createComponentFactory({
    component: WidgetListComponent,
    schemas: [NO_ERRORS_SCHEMA]
  });
  const createHttp = createHttpFactory(WidgetService);

  beforeEach(() => {
    spectator = createComponent();
    widgetService = createHttp();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
