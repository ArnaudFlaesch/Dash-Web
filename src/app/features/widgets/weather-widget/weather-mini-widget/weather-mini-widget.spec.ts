import { WIDGET_DATA, WIDGET_ID } from "@widgets/widget-tokens";
import { environment } from "@environments/environment";

import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { DecimalPipe } from "@angular/common";
import { LOCALE_ID } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { weatherData } from "../weather-widget-fixtures";
import { WeatherMiniWidget } from "./weather-mini-widget";

describe("WeatherMiniWidget", () => {
  const weatherUrl = environment.backend_url + "/weather/current?city=";
  const ERROR_GETTING_WEATHER_DATA = "Erreur lors de la récupération des données météorologiques.";
  let fixture: ComponentFixture<WeatherMiniWidget>;
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
    fixture = TestBed.createComponent(WeatherMiniWidget);
    element = fixture.nativeElement as HTMLElement;
    httpTestingController = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpTestingController.verify();
  });

  function query<T extends HTMLElement = HTMLElement>(selector: string): T | null {
    return element.querySelector<T>(selector);
  }

  describe("Edit mode", () => {
    beforeEach(async () => {
      createComponent(undefined);
      await fixture.whenStable();
    });

    async function typeCity(city: string): Promise<void> {
      const input = query<HTMLInputElement>("#city-name-input")!;
      input.value = city;
      input.dispatchEvent(new Event("input"));
      await fixture.whenStable();
    }

    it("Should display the city input without loading the weather", () => {
      const input = query<HTMLInputElement>("#city-name-input");
      expect(input?.placeholder).toEqual("Saisissez le nom de la ville");
      expect(input?.value).toEqual("");
      expect(query("mat-label")?.textContent).toEqual("Ville");
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
      httpTestingController.expectNone(() => true);
    });

    it("Should not validate a blank city", async () => {
      await typeCity("   ");
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(true);
    });

    it("Should save the city typed in edit mode and load its weather", async () => {
      await typeCity("Lyon");
      expect(query<HTMLButtonElement>(".validate-button")?.disabled).toBe(false);

      query(".validate-button")?.click();
      const saveRequest = httpTestingController.expectOne(
        environment.backend_url + "/mini-widgets/1"
      );
      expect(saveRequest.request.body).toEqual({ data: { city: "Lyon" } });
      saveRequest.flush({});
      // Not whenStable: the pending weather request would keep the fixture unstable
      TestBed.tick();
      expect(query("mat-spinner")).toBeTruthy();

      httpTestingController.expectOne(weatherUrl + "Lyon").flush(weatherData);
      await fixture.whenStable();
      expect(query("mat-spinner")).toBeNull();
      expect(query(".city-name")?.textContent).toEqual("Lyon");
    });
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
      expect(icon?.src).toEqual("https://openweathermap.org/img/wn/01d@2x.png");
      expect(icon?.alt).toEqual("ciel dégagé");
      expect(query(".city-name")?.textContent).toEqual("Paris");
      const temperature = new DecimalPipe(TestBed.inject(LOCALE_ID)).transform(7.57, "1.0-1");
      expect(query(".temperature-container > div")?.textContent).toEqual(`${temperature} °C`);
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
      // Loaded after the error: the spinner is not displayed forever
      expect(query("mat-spinner")).toBeNull();
      expect(query(".city-name")).toBeNull();
    });

    it("Should display an error when the server can't be reached", async () => {
      const handleErrorSpy = vi
        .spyOn(TestBed.inject(ErrorHandlerService), "handleError")
        .mockImplementation(() => undefined);
      httpTestingController
        .expectOne(weatherUrl + "Paris")
        .error(new ProgressEvent("Server error"));
      await fixture.whenStable();

      expect(handleErrorSpy).toHaveBeenCalledWith(expect.anything(), ERROR_GETTING_WEATHER_DATA);
      expect(query("mat-spinner")).toBeNull();
      expect(query(".city-name")).toBeNull();
    });
  });

  it("Should restore the saved configuration when the edition is cancelled", async () => {
    createComponent({ city: "Paris" });
    TestBed.tick();
    httpTestingController.expectOne(weatherUrl + "Paris").flush(weatherData);
    await fixture.whenStable();
    const openEdition = async (): Promise<void> => {
      element.querySelector<HTMLElement>(".read-mini-widget")!.dispatchEvent(new Event("dblclick"));
      await fixture.whenStable();
    };
    await openEdition();
    const input = element.querySelector<HTMLInputElement>("#city-name-input")!;
    input.value = "Lyon";
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();

    element.querySelector<HTMLElement>(".cancel-button")!.click();
    await fixture.whenStable();
    await openEdition();
    expect(element.querySelector<HTMLInputElement>("#city-name-input")!.value).toEqual("Paris");
  });
});
