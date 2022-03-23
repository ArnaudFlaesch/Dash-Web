import { NO_ERRORS_SCHEMA } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { WidgetListComponent } from './widget-list.component';

describe('WidgetListComponent', () => {
  let spectator: Spectator<WidgetListComponent>;

  const createComponent = createComponentFactory({
    component: WidgetListComponent,
    schemas: [NO_ERRORS_SCHEMA]
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should have no widgets', () => {
    expect(spectator.component.widgetList).toEqual([]);
  });
});
