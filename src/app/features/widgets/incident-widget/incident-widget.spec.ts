import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget-tokens";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { of } from "rxjs";
import { vi } from "vitest";
import { startOfYesterday } from "date-fns";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { ConfirmModal } from "@shared/confirm-modal/confirm-modal";
import { Incident, IncidentStreak } from "./incident";
import { IncidentWidget } from "./incident-widget";
import { provideHttpClient } from "@angular/common/http";

describe("IncidentWidget", () => {
  const widgetId = 37;
  const incidentUrl = `${environment.backend_url}/widgets/${widgetId}/incident`;
  // The configuration and the start of the first streak share the same url
  const incidentConfigUrl = { method: "GET", url: incidentUrl };
  const startStreakUrl = { method: "POST", url: incidentUrl };
  const endStreakUrl = `${incidentUrl}/streaks`;
  const incidentConfig = { id: 4, lastIncidentDate: startOfYesterday().toISOString() };
  // Configuration of an incident which has never happened
  const configWithoutIncident = { id: incidentConfig.id } as Incident;
  const streaksUrl = `${environment.backend_url}/incidents/${incidentConfig.id}/streaks`;
  const streaks: IncidentStreak[] = [
    { streakStartDate: "2022-07-01T00:00:00Z", streakEndDate: "2022-07-11T00:00:00Z" },
    { streakStartDate: "2022-08-01T00:00:00Z", streakEndDate: "2022-08-04T00:00:00Z" },
    // Local dates, a month long
    {
      streakStartDate: new Date(2022, 6, 1, 0, 0, 0).toString(),
      streakEndDate: new Date(2022, 7, 1, 0, 0, 0).toString()
    }
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

  /** Answers the request of the configuration of the incident, then of its streaks. */
  async function flushIncident(config: Incident, pastStreaks: IncidentStreak[]): Promise<void> {
    httpTestingController.expectOne(incidentConfigUrl).flush(config);
    await flushResources();
    httpTestingController.expectOne(streaksUrl).flush(pastStreaks);
    await flushResources();
  }

  /** Creates the widget, and answers the request of its configuration and of its streaks. */
  async function createWidget(
    config: Incident,
    pastStreaks: IncidentStreak[] = []
  ): Promise<{ fixture: ComponentFixture<IncidentWidget>; element: HTMLElement }> {
    await configure({ incidentName: "Chute" });
    const fixture = TestBed.createComponent(IncidentWidget);
    TestBed.tick();
    await flushIncident(config, pastStreaks);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function findButton(element: HTMLElement, text: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(text)
    );
  }

  function getDaysSinceLastIncident(element: HTMLElement): string | undefined {
    return element.querySelector("#number-of-days-since-last-incident")?.textContent?.trim();
  }

  function mockConfirmModal(isConfirmed: boolean): ReturnType<typeof vi.spyOn> {
    return vi
      .spyOn(TestBed.inject(MatDialog), "open")
      .mockReturnValue({ afterClosed: () => of(isConfirmed) } as MatDialogRef<unknown>);
  }

  it("should display the configuration form without saved configuration, and save it", async () => {
    await configure();
    const fixture = TestBed.createComponent(IncidentWidget);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const validateButton = element.querySelector<HTMLButtonElement>(".validate-button");

    expect(element.querySelector("#incident-name")).not.toBeNull();
    expect(element.textContent).toContain("Type d'incident");
    expect(validateButton?.disabled).toBe(true);
    // The configuration is not valid, so the widget is not loaded
    httpTestingController.expectNone(incidentConfigUrl);

    const input = element.querySelector<HTMLInputElement>("#incident-name")!;
    input.value = "Chute";
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    expect(validateButton?.disabled).toBe(false);

    validateButton?.click();
    const saveRequest = httpTestingController.expectOne(
      environment.backend_url + "/widgets/" + widgetId
    );
    expect(saveRequest.request.body).toEqual({ data: { incidentName: "Chute" } });
    saveRequest.flush({});
    TestBed.tick();

    // Once saved, the widget is loaded
    await flushIncident(incidentConfig, []);
    await fixture.whenStable();
    expect(element.querySelector(".widget-read-mode")?.textContent).toContain("Incident Chute");
    expect(getDaysSinceLastIncident(element)).toEqual("1 jours");
  });

  it("should display a spinner until the configuration is loaded", async () => {
    await configure({ incidentName: "Chute" });
    const fixture = TestBed.createComponent(IncidentWidget);
    TestBed.tick();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector("mat-spinner")).not.toBeNull();
    expect(element.textContent).toContain("Incident Chute");

    await flushIncident(incidentConfig, []);
    await fixture.whenStable();
    expect(element.querySelector("mat-spinner")).toBeNull();
  });

  it("should start the first streak", async () => {
    const { fixture, element } = await createWidget(configWithoutIncident);
    expect(element.querySelector("#incident-widget-body")).toBeNull();

    findButton(element, "Départ")?.click();
    const startStreakRequest = httpTestingController.expectOne(startStreakUrl);
    expect(startStreakRequest.request.body).toBeNull();
    startStreakRequest.flush({ ...incidentConfig, lastIncidentDate: new Date().toISOString() });
    await flushResources();
    // The streaks of the incident created by the first streak are loaded
    httpTestingController.expectOne(streaksUrl).flush([]);
    await flushResources();
    await fixture.whenStable();

    expect(getDaysSinceLastIncident(element)).toEqual("0 jours");
    expect(findButton(element, "Départ")).toBeUndefined();
  });

  it("should display the current streak, without past streaks", async () => {
    const { element } = await createWidget(incidentConfig);

    expect(element.querySelector("#incident-widget-body-header")?.textContent).toContain(
      "Dernier incident le"
    );
    expect(getDaysSinceLastIncident(element)).toEqual("1 jours");
    expect(element.querySelector("#end-current-streak-button")?.textContent).toContain("Terminer");
    expect(findButton(element, "Séries précédentes")).toBeUndefined();
  });

  it("should switch between the current streak and the past streaks", async () => {
    const { fixture, element } = await createWidget(incidentConfig, streaks);

    findButton(element, "Séries précédentes")?.click();
    await fixture.whenStable();
    expect(element.querySelector("#incident-widget-body")).toBeNull();
    const pastStreaks = [...element.querySelectorAll("#past-streaks-list > div")].map((streak) =>
      streak.textContent?.trim()
    );
    // Most recent streak first, with its number of days
    expect(pastStreaks).toEqual(["3 jours", "31 jours", "10 jours"]);
    expect(element.querySelector("#go-to-current-streak-button")?.textContent).toContain(
      "Série actuelle"
    );

    element.querySelector<HTMLButtonElement>("#go-to-current-streak-button")!.click();
    await fixture.whenStable();
    expect(element.querySelector("#past-streaks-list")).toBeNull();
    expect(element.querySelector("#incident-widget-body")).not.toBeNull();
  });

  it("should end the current streak once confirmed, and reload the past streaks", async () => {
    const { fixture, element } = await createWidget(incidentConfig);
    const openSpy = mockConfirmModal(true);

    element.querySelector<HTMLButtonElement>("#end-current-streak-button")!.click();
    expect(openSpy).toHaveBeenCalledWith(ConfirmModal, {
      width: "600px",
      data: { confirmMessage: "Êtes-vous sûr de vouloir clôturer cette série ?" }
    });
    const endStreakRequest = httpTestingController.expectOne(endStreakUrl);
    expect(endStreakRequest.request.method).toEqual("POST");
    expect(endStreakRequest.request.body).toBeNull();
    endStreakRequest.flush({ ...incidentConfig, lastIncidentDate: new Date().toISOString() });
    TestBed.tick();

    // The ended streak is now one of the past streaks
    httpTestingController.expectOne(streaksUrl).flush([streaks[0]]);
    await flushResources();
    await fixture.whenStable();

    expect(getDaysSinceLastIncident(element)).toEqual("0 jours");
    expect(findButton(element, "Séries précédentes")).not.toBeUndefined();
  });

  it("should not end the current streak when the modal is cancelled", async () => {
    const { fixture, element } = await createWidget(incidentConfig);
    mockConfirmModal(false);

    element.querySelector<HTMLButtonElement>("#end-current-streak-button")!.click();
    await fixture.whenStable();

    httpTestingController.expectNone(endStreakUrl);
    expect(getDaysSinceLastIncident(element)).toEqual("1 jours");
  });

  it("should handle the errors when starting a streak", async () => {
    const { fixture, element } = await createWidget(configWithoutIncident);

    findButton(element, "Départ")?.click();
    httpTestingController
      .expectOne(startStreakUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await fixture.whenStable();
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors du démarrage de la série."
    );
    // Still no incident
    expect(findButton(element, "Départ")).not.toBeUndefined();
    expect(element.querySelector("#incident-widget-body")).toBeNull();
  });

  it("should handle the errors when ending a streak", async () => {
    const { fixture, element } = await createWidget(incidentConfig);
    mockConfirmModal(true);

    element.querySelector<HTMLButtonElement>("#end-current-streak-button")!.click();
    httpTestingController
      .expectOne(endStreakUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await fixture.whenStable();
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la clôture de la série."
    );
    // The current streak goes on
    expect(getDaysSinceLastIncident(element)).toEqual("1 jours");
  });

  it("should handle the errors when getting the configuration and the streaks", async () => {
    await configure({ incidentName: "Chute" });
    const fixture = TestBed.createComponent(IncidentWidget);
    const element = fixture.nativeElement as HTMLElement;
    TestBed.tick();
    httpTestingController
      .expectOne(incidentConfigUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await flushResources();
    await fixture.whenStable();
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération de l'incident."
    );
    // The widget is loaded, without incident
    expect(element.querySelector("mat-spinner")).toBeNull();
    expect(findButton(element, "Départ")).not.toBeUndefined();
    httpTestingController.expectNone(streaksUrl);

    handleErrorSpy.mockClear();
    element.querySelector<HTMLButtonElement>(".refresh-button")?.click();
    TestBed.tick();
    httpTestingController.expectOne(incidentConfigUrl).flush(incidentConfig);
    await flushResources();
    httpTestingController
      .expectOne(streaksUrl)
      .flush(null, { status: 500, statusText: "Internal Server Error" });
    await flushResources();
    await fixture.whenStable();
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des séries."
    );
    // No past streaks
    expect(getDaysSinceLastIncident(element)).toEqual("1 jours");
    expect(findButton(element, "Séries précédentes")).toBeUndefined();
  });
});
