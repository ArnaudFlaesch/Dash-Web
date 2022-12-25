import { NO_ERRORS_SCHEMA } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MiniWidgetListComponent } from './miniwidget-list.component';

describe('MiniWidgetListComponent', () => {
  let spectator: Spectator<MiniWidgetListComponent>;

  const createComponent = createComponentFactory({
    component: MiniWidgetListComponent,
    schemas: [NO_ERRORS_SCHEMA]
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should have no widgets', () => {
    expect(spectator.component.miniWidgetList).toEqual([]);
  });

  it('Should display the widgets', () => {
    spectator.component.miniWidgetList = [
      {
        id: 43,
        type: 1
      },
      {
        id: 44,
        type: 2
      }
    ];
  });
});
