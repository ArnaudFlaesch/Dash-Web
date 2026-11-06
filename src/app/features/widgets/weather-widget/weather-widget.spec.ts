import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget-tokens";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest
} from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { environment } from "@environments/environment";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { forecastData, weatherData } from "./weather-widget-fixtures";
import { WeatherWidget } from "./weather-widget";

describe("WeatherWidget", () => {
  const weatherPath = environment.backend_url + "/weatherWidget/";
  const ERROR_GETTING_WEATHER_DATA = "Erreur lors de la récupération des données météorologiques.";
  let fixture: ComponentFixture<WeatherWidget>;
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
    fixture = TestBed.createComponent(WeatherWidget);
    element = fixture.nativeElement as HTMLElement;
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

  async function typeCity(city: string): Promise<void> {
    const input = query<HTMLInputElement>("#city-name-input")!;
    input.value = city;
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
  }

  describe("Edit mode", () => {
    beforeEach(async () => {
      createComponent(undefined);
      await fixture.whenStable();
    });

    it("Should display the city input without loading the weather", () => {
      const input = query<HTMLInputElement>("#city-name-input");
      expect(input?.placeholder).toEqual("Saisissez le nom de la ville");
      expect(input?.value).toEqual("");
      expect(query("mat-label")?.textContent).toEqual("Ville");
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
      expect(query("dash-weather-widget-view")).toBeNull();
      httpTestingController.expectNone(() => true);
    });

    it("Should not validate a blank city", async () => {
      await typeCity("   ");
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
    });

    it("Should save the city and load its weather", async () => {
      await typeCity("Lyon");
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(false);

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
      forecastRequest.flush({ ...forecastData, city: { ...forecastData.city, name: "Lyon" } });
      await fixture.whenStable();
      expect(query(".widget-header")?.textContent).toContain("La météo aujourd'hui à Lyon");
      expect(query("mat-spinner")).toBeNull();
      expect(query("dash-weather-widget-view")).toBeTruthy();
      // One button per day of the forecast
      expect(element.querySelectorAll(".select-forecast")).toHaveLength(3);
    });
  });

  describe("Read mode", () => {
    beforeEach(() => {
      createComponent({ city: "Paris" });
      TestBed.tick();
    });

    it("Should display a spinner, then the weather of the city", async () => {
      expect(query(".widget-header")?.textContent).toContain("La météo aujourd'hui à Paris");
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
      // Loaded: the spinner is replaced by the (empty) body
      expect(query("mat-spinner")).toBeNull();
      expect(query("dash-weather-widget-view")).toBeNull();
    });

    it("Should not display the weather view without city in the forecast", async () => {
      const [weatherRequest, forecastRequest] = expectWeatherRequests("Paris");
      weatherRequest.flush(weatherData);
      forecastRequest.flush({ ...forecastData, city: undefined });
      await fixture.whenStable();
      expect(query("mat-spinner")).toBeNull();
      expect(query("dash-weather-widget-view")).toBeNull();
    });

    it("Should display the weather without forecast when the forecast has no list", async () => {
      const [weatherRequest, forecastRequest] = expectWeatherRequests("Paris");
      weatherRequest.flush(weatherData);
      forecastRequest.flush({ ...forecastData, list: undefined });
      await fixture.whenStable();
      expect(query("dash-weather-widget-view dash-weather-today")).toBeTruthy();
      expect(query(".select-forecast")).toBeNull();
      expect(query("dash-weather-forecast .forecast-container")).toBeNull();
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
      // Not loaded: the spinner is kept
      expect(query("mat-spinner")).toBeTruthy();
      expect(query("dash-weather-widget-view")).toBeNull();
    });

    it("Should display an error when the server can't be reached", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      const [weatherRequest, forecastRequest] = expectWeatherRequests("Paris");
      forecastRequest.error(new ProgressEvent("Server error"));
      await fixture.whenStable();

      expect(weatherRequest.cancelled).toBe(true);
      expect(handleErrorSpy).toHaveBeenCalledWith(expect.anything(), ERROR_GETTING_WEATHER_DATA);
      expect(query("mat-spinner")).toBeTruthy();
      expect(query("dash-weather-widget-view")).toBeNull();
    });
  });
});
