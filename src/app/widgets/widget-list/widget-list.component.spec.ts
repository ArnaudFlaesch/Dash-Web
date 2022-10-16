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

  it('Should display the widgets', () => {
    spectator.component.widgetList = [
      {
        id: 43,
        type: 1,
        widgetOrder: 1,
        tab: { id: 1 }
      },
      {
        id: 44,
        type: 2,

        widgetOrder: 2,
        tab: { id: 1 }
      },
      {
        id: 45,
        type: 3,
        widgetOrder: 3,
        tab: { id: 1 }
      },
      {
        id: 46,
        type: 4,
        widgetOrder: 4,
        tab: { id: 1 }
      },
      {
        id: 47,
        type: 5,
        widgetOrder: 5,
        tab: { id: 1 }
      },
      {
        id: 48,
        type: 6,
        widgetOrder: 6,
        tab: { id: 1 }
      },
      {
        id: 49,
        type: 7,
        widgetOrder: 7,
        tab: { id: 1 }
      }
    ];
  });
});
