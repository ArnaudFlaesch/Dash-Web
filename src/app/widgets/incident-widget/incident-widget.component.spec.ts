import { WIDGET_DATA, WIDGET_ID } from "../widget.tokens";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { of } from "rxjs";
import { vi } from "vitest";
import { startOfYesterday } from "date-fns";
import { environment } from "../../../environments/environment";
import { ErrorHandlerService } from "../../services/error-handler.service";
import { WidgetService } from "../../services/widget.service";
import { IIncident, IIncidentStreak } from "./IIncident";
import { IncidentWidgetComponent } from "./incident-widget.component";
import { IncidentWidgetService } from "./incident-widget.service";
import { provideHttpClient } from "@angular/common/http";

describe("IncidentWidgetComponent", () => {
  let component: IncidentWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ErrorHandlerService,
        IncidentWidgetService,
        WidgetService,
        { provide: WIDGET_ID, useValue: widgetId }
      ]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(IncidentWidgetComponent, "")
      .compileComponents();

    const fixture = TestBed.createComponent(IncidentWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  const widgetId = "37";

  it("should create", async () => {
    expect(component.daysSinceLastIncident()).toEqual(0);

    const incidentWidgetConfig = {
      id: 1,
      lastIncidentDate: startOfYesterday().toString()
    } as IIncident;

    expect(component.widgetData()).toEqual(undefined);
    component.refreshWidget();
    TestBed.tick();

    expect(component.isWidgetLoaded()).toEqual(false);
    const request = httpTestingController.expectOne(
      environment.backend_url + "/incidentWidget/incidentWidgetConfig?widgetId=" + widgetId
    );
    request.flush(incidentWidgetConfig);
    await flushResources();

    const getStreaksRequest = httpTestingController.expectOne(
      environment.backend_url + "/incidentWidget/streaks?incidentId=" + incidentWidgetConfig.id
    );
    getStreaksRequest.flush([]);
    await flushResources();

    component.startNewStreak();
    const startStreakRequest = httpTestingController.expectOne(
      environment.backend_url + "/incidentWidget/startFirstStreak"
    );
    startStreakRequest.flush(incidentWidgetConfig);

    component.config.update((config) => ({ ...config, incidentName: "Incident test" }));

    expect(component.isFormValid()).toEqual(true);

    component.goToPastStreaksView();
    expect(component.isWidgetViewCurrentStreak()).toEqual(false);
    expect(component.isWidgetViewPastStreaks()).toEqual(true);

    component.goToCurrentStreakView();
    expect(component.isWidgetViewPastStreaks()).toEqual(false);
    expect(component.isWidgetViewCurrentStreak()).toEqual(true);

    expect(component.daysSinceLastIncident()).toEqual(1);
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

describe("IncidentWidgetComponent rendering", () => {
  const widgetId = 37;
  const incidentConfigUrl =
    environment.backend_url + "/incidentWidget/incidentWidgetConfig?widgetId=" + widgetId;
  const incidentConfig = { id: 4, lastIncidentDate: startOfYesterday().toISOString() } as IIncident;
  // Configuration of an incident which has never happened
  const configWithoutIncident = { id: incidentConfig.id } as IIncident;
  const streaksUrl =
    environment.backend_url + "/incidentWidget/streaks?incidentId=" + incidentConfig.id;
  const streaks: IIncidentStreak[] = [
    { streakStartDate: "2022-07-01T00:00:00Z", streakEndDate: "2022-07-11T00:00:00Z" },
    { streakStartDate: "2022-08-01T00:00:00Z", streakEndDate: "2022-08-04T00:00:00Z" }
  ];

  let httpTestingController: HttpTestingController;
  let handleErrorSpy: ReturnType<typeof vi.spyOn>;

  async function configure(widgetData?: Record<string, unknown>): Promise<void> {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: widgetId },
        ...(widgetData ? [{ provide: WIDGET_DATA, useValue: widgetData }] : [])
      ]
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    handleErrorSpy = vi
      .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
      .mockImplementation(() => undefined);
  }

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then load the requests depending on them. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  /** Creates the widget, and answers the request of its configuration and of its streaks. */
  async function createWidget(
    config: IIncident,
    pastStreaks: IIncidentStreak[] = []
  ): Promise<{ fixture: ComponentFixture<IncidentWidgetComponent>; element: HTMLElement }> {
    await configure({ incidentName: "Chute" });
    const fixture = TestBed.createComponent(IncidentWidgetComponent);
    TestBed.tick();
    httpTestingController.expectOne(incidentConfigUrl).flush(config);
    await flushResources();
    httpTestingController.expectOne(streaksUrl).flush(pastStreaks);
    await flushResources();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function findButton(element: HTMLElement, text: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(text)
    );
  }

  it("should display the configuration form without saved configuration", async () => {
    await configure();
    const fixture = TestBed.createComponent(IncidentWidgetComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector("#incident-name")).not.toBeNull();
    expect(element.textContent).toContain(fixture.componentInstance.labels.incidentType);
    // The configuration is not valid, so the widget is not loaded
    httpTestingController.expectNone(incidentConfigUrl);

    const input = element.querySelector("#incident-name") as HTMLInputElement;
    input.value = "Chute";
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    expect(fixture.componentInstance.widgetData()).toEqual({ incidentName: "Chute" });
  });

  it("should display a spinner until the configuration is loaded", async () => {
    await configure({ incidentName: "Chute" });
    const fixture = TestBed.createComponent(IncidentWidgetComponent);
    TestBed.tick();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector("mat-spinner")).not.toBeNull();
    expect(element.textContent).toContain(`${fixture.componentInstance.labels.incident} Chute`);

    httpTestingController.expectOne(incidentConfigUrl).flush(incidentConfig);
    await flushResources();
    httpTestingController.expectOne(streaksUrl).flush([]);
    await flushResources();
    await fixture.whenStable();
    expect(element.querySelector("mat-spinner")).toBeNull();
  });

  it("should start the first streak", async () => {
    const { fixture, element } = await createWidget(configWithoutIncident);
    const labels = fixture.componentInstance.labels;
    expect(element.querySelector("#incident-widget-body")).toBeNull();

    findButton(element, labels.start)?.click();
    const startStreakRequest = httpTestingController.expectOne(
      environment.backend_url + "/incidentWidget/startFirstStreak"
    );
    expect(startStreakRequest.request.body).toEqual({ widgetId });
    startStreakRequest.flush({ ...incidentConfig, lastIncidentDate: new Date().toISOString() });
    await fixture.whenStable();

    expect(element.querySelector("#number-of-days-since-last-incident")?.textContent).toContain(
      `0 ${labels.days}`
    );
    expect(findButton(element, labels.start)).toBeUndefined();
  });

  it("should display the current streak, without past streaks", async () => {
    const { fixture, element } = await createWidget(incidentConfig);
    const labels = fixture.componentInstance.labels;

    expect(element.querySelector("#incident-widget-body-header")?.textContent).toContain(
      labels.lastIncidentOn
    );
    expect(element.querySelector("#number-of-days-since-last-incident")?.textContent).toContain(
      `1 ${labels.days}`
    );
    expect(element.querySelector("#end-current-streak-button")?.textContent).toContain(labels.end);
    expect(findButton(element, labels.pastStreaks)).toBeUndefined();
  });

  it("should switch between the current streak and the past streaks", async () => {
    const { fixture, element } = await createWidget(incidentConfig, streaks);
    const labels = fixture.componentInstance.labels;

    findButton(element, labels.pastStreaks)?.click();
    await fixture.whenStable();
    expect(element.querySelector("#incident-widget-body")).toBeNull();
    const pastStreaks = element.querySelectorAll("#past-streaks-list > div");
    // Most recent streak first
    expect(pastStreaks).toHaveLength(2);
    expect(pastStreaks[0].textContent).toContain(`3 ${labels.days}`);
    expect(pastStreaks[1].textContent).toContain(`10 ${labels.days}`);

    (element.querySelector("#go-to-current-streak-button") as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(element.querySelector("#past-streaks-list")).toBeNull();
    expect(element.querySelector("#incident-widget-body")).not.toBeNull();
  });

  it("should end the current streak once confirmed, and reload the past streaks", async () => {
    const { fixture, element } = await createWidget(incidentConfig);
    const openSpy = vi
      .spyOn(TestBed.inject(MatDialog), "open")
      .mockReturnValue({ afterClosed: () => of(true) } as MatDialogRef<unknown>);

    (element.querySelector("#end-current-streak-button") as HTMLButtonElement).click();
    expect(openSpy).toHaveBeenCalled();
    const endStreakRequest = httpTestingController.expectOne(
      environment.backend_url + "/incidentWidget/endStreak"
    );
    expect(endStreakRequest.request.body).toEqual({ widgetId });
    endStreakRequest.flush({ ...incidentConfig, lastIncidentDate: new Date().toISOString() });
    TestBed.tick();

    // The ended streak is now one of the past streaks
    httpTestingController.expectOne(streaksUrl).flush([streaks[0]]);
    await flushResources();
    await fixture.whenStable();

    expect(element.querySelector("#number-of-days-since-last-incident")?.textContent).toContain(
      `0 ${fixture.componentInstance.labels.days}`
    );
    expect(findButton(element, fixture.componentInstance.labels.pastStreaks)).not.toBeUndefined();
  });

  it("should not end the current streak when the modal is cancelled", async () => {
    const { fixture, element } = await createWidget(incidentConfig);
    vi.spyOn(TestBed.inject(MatDialog), "open").mockReturnValue({
      afterClosed: () => of(false)
    } as MatDialogRef<unknown>);

    (element.querySelector("#end-current-streak-button") as HTMLButtonElement).click();
    await fixture.whenStable();

    httpTestingController.expectNone(environment.backend_url + "/incidentWidget/endStreak");
    expect(element.querySelector("#number-of-days-since-last-incident")?.textContent).toContain(
      `1 ${fixture.componentInstance.labels.days}`
    );
  });

  it("should handle the errors when starting or ending a streak", async () => {
    const { fixture, element } = await createWidget(configWithoutIncident);

    findButton(element, fixture.componentInstance.labels.start)?.click();
    httpTestingController
      .expectOne(environment.backend_url + "/incidentWidget/startFirstStreak")
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors du démarrage de la série."
    );
    expect(fixture.componentInstance.lastIncidentDate()).toBeUndefined();

    vi.spyOn(TestBed.inject(MatDialog), "open").mockReturnValue({
      afterClosed: () => of(true)
    } as MatDialogRef<unknown>);
    fixture.componentInstance.openEndStreakModal();
    httpTestingController
      .expectOne(environment.backend_url + "/incidentWidget/endStreak")
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la clôture de la série."
    );
  });

  it("should handle the errors when getting the configuration and the streaks", async () => {
    await configure({ incidentName: "Chute" });
    const fixture = TestBed.createComponent(IncidentWidgetComponent);
    TestBed.tick();
    httpTestingController
      .expectOne(incidentConfigUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await flushResources();
    await fixture.whenStable();
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des séries."
    );
    expect(fixture.componentInstance.isWidgetLoaded()).toBe(true);
    httpTestingController.expectNone(streaksUrl);

    handleErrorSpy.mockClear();
    fixture.componentInstance.refreshWidget();
    TestBed.tick();
    httpTestingController.expectOne(incidentConfigUrl).flush(incidentConfig);
    await flushResources();
    httpTestingController
      .expectOne(streaksUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await flushResources();
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des séries."
    );
    expect(fixture.componentInstance.streaks()).toEqual([]);
  });
});
