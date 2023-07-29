import {
  createComponentFactory,
  createHttpFactory,
  HttpMethod,
  Spectator,
  SpectatorHttp
} from '@ngneat/spectator/jest';

import { IncidentWidgetComponent } from './incident-widget.component';
import { IncidentWidgetService } from './incident.widget.service';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { IIncident, IIncidentStreak } from './IIncident';
import { MatDialogModule } from '@angular/material/dialog';
import { startOfYesterday } from 'date-fns';

describe('IncidentWidgetComponent', () => {
  let spectator: Spectator<IncidentWidgetComponent>;
  let incidentWidgetService: SpectatorHttp<IncidentWidgetService>;

  const createHttpIncidentWidgetService = createHttpFactory(IncidentWidgetService);
  const widgetId = '37';

  const createComponent = createComponentFactory({
    component: IncidentWidgetComponent,
    imports: [MatDialogModule, MatSnackBarModule],
    providers: [ErrorHandlerService, { provide: 'widgetId', useValue: widgetId }]
  });

  beforeEach(() => {
    spectator = createComponent();
    incidentWidgetService = createHttpIncidentWidgetService();
  });

  it('should create', () => {
    expect(spectator.component.getDaysSinceLastIncident()).toEqual(0);

    const incidentWidgetConfig = {
      id: 1,
      incidentName: 'Incident name',
      lastIncidentDate: startOfYesterday().toString()
    } as IIncident;

    expect(spectator.component.getWidgetConfig()).toEqual(undefined);
    spectator.component.incidentName = incidentWidgetConfig.incidentName;
    spectator.component.refreshWidget();

    expect(spectator.component.isWidgetLoaded).toEqual(false);
    const request = incidentWidgetService.expectOne(
      environment.backend_url + '/incidentWidget/incidentWidgetConfig?widgetId=' + widgetId,
      HttpMethod.GET
    );
    request.flush(incidentWidgetConfig);

    const getStreaksRequest = incidentWidgetService.expectOne(
      environment.backend_url + '/incidentWidget/streaks?incidentId=' + incidentWidgetConfig.id,
      HttpMethod.GET
    );
    getStreaksRequest.flush([]);

    expect(spectator.component.getWidgetConfig()).toEqual({
      incidentName: incidentWidgetConfig.incidentName
    });

    spectator.component.startNewStreak();
    const startStreakRequest = incidentWidgetService.expectOne(
      environment.backend_url + '/incidentWidget/startFirstStreak',
      HttpMethod.POST
    );
    startStreakRequest.flush(incidentWidgetConfig);

    expect(spectator.component.isFormValid()).toEqual(true);

    spectator.component.goToPastStreaksView();
    expect(spectator.component.isWidgetViewCurrentStreak()).toEqual(false);
    expect(spectator.component.isWidgetViewPastStreaks()).toEqual(true);

    spectator.component.goToCurrentStreakView();
    expect(spectator.component.isWidgetViewPastStreaks()).toEqual(false);
    expect(spectator.component.isWidgetViewCurrentStreak()).toEqual(true);

    expect(spectator.component.getDaysSinceLastIncident()).toEqual(1);
  });

  it('Should calculate number of days of streak', () => {
    const streak = {
      streakStartDate: new Date(2022, 6, 1, 0, 0, 0).toString(),
      streakEndDate: new Date(2022, 7, 1, 0, 0, 0).toString()
    } as IIncidentStreak;

    expect(
      spectator.component.getNumberOfDaysFromStreak(streak.streakStartDate, streak.streakEndDate)
    ).toEqual(31);
  });
});
