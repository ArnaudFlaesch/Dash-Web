import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget.tokens";
import { environment } from "@environments/environment";

import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { DecimalPipe } from "@angular/common";
import { LOCALE_ID } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { ErrorHandlerService } from "@services/error-handler.service";
import { WeatherMiniWidgetComponent } from "./weather-miniwidget.component";

// Not imported from the weather widget spec, so that its tests are not run a second time
const weatherData = {
  weather: [{ id: 800, main: "Clear", description: "ciel dégagé", icon: "01d" }],
  main: { temp: 7.57 },
  timezone: 3600,
  name: "Paris"
};

describe("WeatherMiniWidgetComponent", () => {
  let component: WeatherMiniWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: 1 }
      ]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(WeatherMiniWidgetComponent, "")
      .compileComponents();

    const fixture = TestBed.createComponent(WeatherMiniWidgetComponent);
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

  it("Should create widget", async () => {
    expect(component.widgetData()).toBeUndefined();
    expect(component.isFormValid()).toEqual(false);
    expect(component.isWidgetLoaded()).toEqual(false);

    const city = "Paris";
    component.config.update((config) => ({ ...config, city: city }));

    expect(component.widgetData()).toEqual({ city: city });
    expect(component.isFormValid()).toEqual(true);

    component.refreshWidget();
    TestBed.tick();
    const request = httpTestingController.expectOne(
      environment.backend_url + "/weatherWidget/weather?city=" + city
    );
    request.flush({});
    await flushResources();
    expect(component.isWidgetLoaded()).toEqual(true);
  });

  it("Should not refresh widget because of error", async () => {
    const city = "Paris";
    component.config.update((config) => ({ ...config, city: city }));

    component.refreshWidget();
    TestBed.tick();
    httpTestingController
      .expectOne(environment.backend_url + "/weatherWidget/weather?city=" + city)
      .error(new ProgressEvent("Server error"));
    await flushResources();
    expect(component.weather()).toBeNull();
    expect(component.isWidgetLoaded()).toBe(false);
  });

  it("Should get weather icons", () => {
    const icon = "sunny";
    expect(component.getIconFromWeatherApi(icon)).toEqual(
      `https://openweathermap.org/img/wn/${icon}@2x.png`
    );
  });
});

describe("WeatherMiniWidgetComponent template", () => {
  const weatherUrl = environment.backend_url + "/weatherWidget/weather?city=";
  const ERROR_GETTING_WEATHER_DATA = "Erreur lors de la récupération des données météorologiques.";
  let fixture: ComponentFixture<WeatherMiniWidgetComponent>;
  let component: WeatherMiniWidgetComponent;
  let element: HTMLElement;
  let httpTestingController: HttpTestingController;

  function createComponent(widgetData: Record<string, unknown> | undefined): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WIDGET_ID, useValue: 1 },
        { provide: WIDGET_DATA, useValue: widgetData }
      ]
    });
    fixture = TestBed.createComponent(WeatherMiniWidgetComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    httpTestingController = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpTestingController.verify();
  });

  function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return element.querySelector<T>(selector);
  }

  it("Should save the city typed in edit mode and load its weather", async () => {
    createComponent(undefined);
    await fixture.whenStable();
    const input = query<HTMLInputElement>("#city-name-input")!;
    expect(input.placeholder).toEqual(component.labels.enterCityName);
    expect(query("mat-label")?.textContent).toEqual(component.labels.city);
    expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);

    input.value = "Lyon";
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(false);

    query(".validate-button")?.click();
    const saveRequest = httpTestingController.expectOne(
      environment.backend_url + "/miniWidget/updateWidgetData/1"
    );
    expect(saveRequest.request.body).toEqual({ data: { city: "Lyon" } });
    saveRequest.flush({});
    // Not whenStable: the pending weather request would keep the fixture unstable
    TestBed.tick();

    httpTestingController.expectOne(weatherUrl + "Lyon").flush(weatherData);
    await fixture.whenStable();
    expect(query(".city-name")?.textContent).toEqual("Lyon");
  });

  describe("Read mode", () => {
    beforeEach(() => {
      createComponent({ city: "Paris" });
      TestBed.tick();
    });

    it("Should display a spinner, then the weather of the city", async () => {
      expect(query("mat-spinner")).toBeTruthy();
      httpTestingController.expectOne(weatherUrl + "Paris").flush(weatherData);
      await fixture.whenStable();

      expect(query("mat-spinner")).toBeNull();
      const icon = query<HTMLImageElement>(".current-weather-icon");
      expect(icon?.src).toEqual(component.getIconFromWeatherApi("01d"));
      expect(icon?.alt).toEqual("ciel dégagé");
      expect(query(".city-name")?.textContent).toEqual("Paris");
      const temperature = new DecimalPipe(TestBed.inject(LOCALE_ID)).transform(7.57, "1.0-1");
      expect(query(".temperature-container > div")?.textContent).toEqual(
        `${temperature} ${component.labels.celsius}`
      );
    });

    it("Should display an error when the weather can't be loaded", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      httpTestingController
        .expectOne(weatherUrl + "Paris")
        .flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(expect.anything(), ERROR_GETTING_WEATHER_DATA);
      expect(component.isWidgetLoaded()).toBe(false);
      expect(query("mat-spinner")).toBeTruthy();
      expect(query(".city-name")).toBeNull();
    });
  });
});
