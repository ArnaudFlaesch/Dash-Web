import { WIDGET_ID } from "../../widget.tokens";
import { environment } from "../../../../environments/environment";

import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { DateUtilsService } from "../../../services/date.utils.service/date.utils.service";
import { ErrorHandlerService } from "../../../services/error.handler.service";
import { MiniWidgetService } from "../../../services/widget.service/miniwidget.service";
import { WidgetService } from "../../../services/widget.service/widget.service";
import { WeatherWidgetService } from "../weather.widget.service";
import { WeatherMiniWidgetComponent } from "./weather-miniwidget.component";

describe("WeatherMiniWidgetComponent", () => {
  let component: WeatherMiniWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WeatherWidgetService,
        DateUtilsService,
        ErrorHandlerService,
        WidgetService,
        MiniWidgetService,
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
    expect(component.getWidgetData()).toBeUndefined();
    expect(component.isFormValid()).toEqual(false);
    expect(component.isWidgetLoaded()).toEqual(false);

    const city = "Paris";
    component.config.update((config) => ({ ...config, city: city }));

    expect(component.getWidgetData()).toEqual({ city: city });
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
