import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget.tokens";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest
} from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler.service";
import { forecastData, weatherData } from "./weather-widget.fixtures";
import { WeatherWidgetComponent } from "./weather-widget.component";

describe("WeatherWidgetComponent", () => {
  let component: WeatherWidgetComponent;
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
      .overrideTemplate(WeatherWidgetComponent, "")
      .compileComponents();

    const fixture = TestBed.createComponent(WeatherWidgetComponent);
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

  describe("Normal cases", () => {
    it("should create", async () => {
      expect(component.widgetData()).toBeUndefined();
      expect(component.isFormValid()).toEqual(false);
      const cityName = "Paris";
      expect(component.cityData()).toBeUndefined();
      expect(component.forecastResponse()).toEqual([]);
      expect(component.isWidgetLoaded()).toEqual(false);
      component.config.update((config) => ({ ...config, city: cityName }));
      expect(component.isFormValid()).toEqual(true);
      expect(component.widgetData()).toEqual({ city: cityName });
      component.refreshWidget();
      TestBed.tick();

      const requests = httpTestingController.match({ method: "GET" });
      requests[0].flush(weatherData);
      await flushResources();
      requests[1].flush(forecastData);
      await flushResources();

      expect(component.cityData()?.name).toEqual(cityName);
      expect(component.forecastResponse()).toHaveLength(forecastData.list.length);
      expect(component.isWidgetLoaded()).toEqual(true);
    });
  });

  describe("Error cases", () => {
    it("should display error messages", async () => {
      const cityName = "Paris";
      component.config.update((config) => ({ ...config, city: cityName }));
      component.refreshWidget();
      TestBed.tick();
      const requests = httpTestingController.match({ method: "GET" });
      requests[0].error(new ProgressEvent("Server error"));
      await flushResources();

      expect(component.weather()).toBeUndefined();
      expect(component.forecastResponse()).toEqual([]);
    });
  });
});

describe("WeatherWidgetComponent template", () => {
  const weatherPath = environment.backend_url + "/weatherWidget/";
  const ERROR_GETTING_WEATHER_DATA = "Erreur lors de la récupération des données météorologiques.";
  let fixture: ComponentFixture<WeatherWidgetComponent>;
  let component: WeatherWidgetComponent;
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
    fixture = TestBed.createComponent(WeatherWidgetComponent);
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

  function expectWeatherRequests(city: string): TestRequest[] {
    return [
      httpTestingController.expectOne(`${weatherPath}weather?city=${city}`),
      httpTestingController.expectOne(`${weatherPath}forecast?city=${city}`)
    ];
  }

  describe("Edit mode", () => {
    beforeEach(async () => {
      createComponent(undefined);
      await fixture.whenStable();
    });

    it("Should display the city input", () => {
      const input = query<HTMLInputElement>("#city-name-input");
      expect(input?.placeholder).toEqual(component.labels.enterCityName);
      expect(query("mat-label")?.textContent).toEqual(component.labels.city);
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
    });

    it("Should not validate a blank city", async () => {
      const input = query<HTMLInputElement>("#city-name-input")!;
      input.value = "   ";
      input.dispatchEvent(new Event("input"));
      await fixture.whenStable();
      expect(component.isFormValid()).toBe(false);
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
    });

    it("Should save the city and load its weather", async () => {
      const input = query<HTMLInputElement>("#city-name-input")!;
      input.value = "Lyon";
      input.dispatchEvent(new Event("input"));
      await fixture.whenStable();
      expect(component.config()).toEqual({ city: "Lyon" });

      query(".validate-button")?.click();
      const saveRequest = httpTestingController.expectOne(
        environment.backend_url + "/widget/updateWidgetData/1"
      );
      expect(saveRequest.request.body).toEqual({ data: { city: "Lyon" } });
      saveRequest.flush({});
      // Not whenStable: the pending weather requests would keep the fixture unstable
      TestBed.tick();

      const [weatherRequest, forecastRequest] = expectWeatherRequests("Lyon");
      weatherRequest.flush({ ...weatherData, name: "Lyon" });
      forecastRequest.flush(forecastData);
      await fixture.whenStable();
      expect(query(".widget-header")?.textContent).toContain(
        `${component.labels.weatherTodayIn} Lyon`
      );
      expect(query("dash-weather-widget-view")).toBeTruthy();
    });
  });

  describe("Read mode", () => {
    beforeEach(() => {
      createComponent({ city: "Paris" });
      TestBed.tick();
    });

    it("Should display a spinner, then the weather of the city", async () => {
      expect(query(".widget-header")?.textContent).toContain(
        `${component.labels.weatherTodayIn} Paris`
      );
      expect(query("mat-spinner")).toBeTruthy();
      const [weatherRequest, forecastRequest] = expectWeatherRequests("Paris");
      weatherRequest.flush(weatherData);
      forecastRequest.flush(forecastData);
      await fixture.whenStable();

      expect(query("mat-spinner")).toBeNull();
      expect(query("dash-weather-widget-view dash-weather-today")).toBeTruthy();
      expect(query("dash-weather-widget-view dash-weather-forecast")).toBeTruthy();
    });

    it("Should not display the weather view without weather description", async () => {
      const [weatherRequest, forecastRequest] = expectWeatherRequests("Paris");
      weatherRequest.flush({ ...weatherData, weather: undefined });
      forecastRequest.flush(forecastData);
      await fixture.whenStable();
      expect(component.isWidgetLoaded()).toBe(true);
      expect(query("dash-weather-widget-view")).toBeNull();
    });

    it("Should reload the weather when the widget is refreshed", async () => {
      expectWeatherRequests("Paris").forEach((request, index) =>
        request.flush([weatherData, forecastData][index])
      );
      await fixture.whenStable();

      query(".refresh-button")?.click();
      TestBed.tick();
      expectWeatherRequests("Paris").forEach((request, index) =>
        request.flush([weatherData, forecastData][index])
      );
      await fixture.whenStable();
      expect(query("dash-weather-widget-view")).toBeTruthy();
    });

    it("Should display an error when the weather can't be loaded", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      const [weatherRequest, forecastRequest] = expectWeatherRequests("Paris");
      weatherRequest.flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();

      expect(forecastRequest.cancelled).toBe(true);

      expect(handleErrorSpy).toHaveBeenCalledTimes(1);
      expect(handleErrorSpy).toHaveBeenCalledWith(expect.anything(), ERROR_GETTING_WEATHER_DATA);
      expect(component.isWidgetLoaded()).toBe(false);
      expect(query("mat-spinner")).toBeTruthy();
      expect(query("dash-weather-widget-view")).toBeNull();
    });
  });
});
