import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { startOfYesterday } from "date-fns";
import { environment } from "../../../environments/environment";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { WidgetService } from "../../services/widget.service/widget.service";
import { IIncident, IIncidentStreak } from "./IIncident";
import { IncidentWidgetComponent } from "./incident-widget.component";
import { IncidentWidgetService } from "./incident.widget.service";
import { provideHttpClient } from "@angular/common/http";

describe("IncidentWidgetComponent", () => {
  let component: IncidentWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MatSnackBarModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ErrorHandlerService,
        IncidentWidgetService,
        WidgetService,
        { provide: "widgetId", useValue: widgetId }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(IncidentWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  const widgetId = "37";

  it("should create", () => {
    expect(component.getDaysSinceLastIncident()).toEqual(0);

    const incidentWidgetConfig = {
      id: 1,
      lastIncidentDate: startOfYesterday().toString()
    } as IIncident;

    expect(component.getWidgetConfig()).toEqual(undefined);
    component.refreshWidget();

    expect(component.isWidgetLoaded).toEqual(false);
    const request = httpTestingController.expectOne(
      environment.backend_url + "/incidentWidget/incidentWidgetConfig?widgetId=" + widgetId
    );
    request.flush(incidentWidgetConfig);

    const getStreaksRequest = httpTestingController.expectOne(
      environment.backend_url + "/incidentWidget/streaks?incidentId=" + incidentWidgetConfig.id
    );
    getStreaksRequest.flush([]);

    component.startNewStreak();
    const startStreakRequest = httpTestingController.expectOne(
      environment.backend_url + "/incidentWidget/startFirstStreak"
    );
    startStreakRequest.flush(incidentWidgetConfig);

    component.incidentName = "Incident test";

    expect(component.isFormValid()).toEqual(true);

    component.goToPastStreaksView();
    expect(component.isWidgetViewCurrentStreak()).toEqual(false);
    expect(component.isWidgetViewPastStreaks()).toEqual(true);

    component.goToCurrentStreakView();
    expect(component.isWidgetViewPastStreaks()).toEqual(false);
    expect(component.isWidgetViewCurrentStreak()).toEqual(true);

    expect(component.getDaysSinceLastIncident()).toEqual(1);
  });

  it("Should calculate number of days of streak", () => {
    const streak = {
      streakStartDate: new Date(2022, 6, 1, 0, 0, 0).toString(),
      streakEndDate: new Date(2022, 7, 1, 0, 0, 0).toString()
    } as IIncidentStreak;

    expect(
      component.getNumberOfDaysFromStreak(streak.streakStartDate, streak.streakEndDate)
    ).toEqual(31);
  });
});
