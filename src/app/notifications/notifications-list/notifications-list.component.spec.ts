import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { NotificationsListComponent } from './notifications-list.component';

describe('NotificationsListComponent', () => {
  let spectator: Spectator<NotificationsListComponent>;

  const createComponent = createComponentFactory({
    component: NotificationsListComponent,
    imports: [],
    providers: [],
    schemas: []
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
