import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { WidgetService } from "../../services/widget.service/widget.service";
import { EcowattWidgetComponent } from "./ecowatt-widget.component";
import { provideHttpClient } from "@angular/common/http";

describe("EcowattWidgetComponent", () => {
  let component: EcowattWidgetComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        WidgetService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: "widgetId", useValue: 1 }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(EcowattWidgetComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    component.refreshWidget();
    component.ngAfterViewInit();
    expect(component.getWidgetData()).toEqual({});
  });
});
