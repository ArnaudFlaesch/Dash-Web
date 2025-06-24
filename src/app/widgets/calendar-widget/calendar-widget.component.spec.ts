import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { CalendarView, DateAdapter } from "angular-calendar";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import { DateUtilsService } from "../../services/date.utils.service/date.utils.service";
import { WidgetService } from "../../services/widget.service/widget.service";
import { ErrorHandlerService } from "./../../services/error.handler.service";
import { CalendarWidgetComponent } from "./calendar-widget.component";
import { CalendarWidgetService } from "./calendar-widget.service";
import { provideHttpClient } from "@angular/common/http";

describe("CalendarWidgetComponent", () => {
  let component: CalendarWidgetComponent;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MatSnackBarModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CalendarWidgetService,
        DateAdapter,
        DateUtilsService,
        ErrorHandlerService,
        WidgetService,
        { provide: "widgetId", useValue: 1 }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CalendarWidgetComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should create", () => {
    expect(component.calendarUrls()).toEqual([]);
    component.refreshWidget();
    expect(component.events()).toEqual([]);
    expect(component.isCalendarViewMonth()).toEqual(true);
    component.calendarUrls().push("https://calendar.ical");
    component.refreshWidget();
    const getCalendarDataRequest = httpTestingController.expectOne(
      environment.backend_url + `/calendarWidget/`
    );
    const getCalendarData = [
      {
        startDate: "2022-11-01T00:00:00.000+00:00",
        endDate: "2022-11-02T00:00:00.000+00:00",
        description: "La Toussaint"
      },
      {
        startDate: "2021-05-23T00:00:00.000+00:00",
        endDate: "2021-05-24T00:00:00.000+00:00",
        description: "Pentecôte"
      },
      {
        startDate: "2022-12-25T00:00:00.000+00:00",
        endDate: "2022-12-26T00:00:00.000+00:00",
        description: "Noël"
      },
      {
        startDate: "2023-12-24T00:00:00.000+00:00",
        endDate: "2023-12-25T00:00:00.000+00:00",
        description: "La veille de Noël"
      },
      {
        startDate: "2021-11-01T00:00:00.000+00:00",
        endDate: "2021-11-02T00:00:00.000+00:00",
        description: "La Toussaint"
      },
      {
        startDate: "2022-07-14T00:00:00.000+00:00",
        endDate: "2022-07-15T00:00:00.000+00:00",
        description: "La fête nationale"
      }
    ];
    getCalendarDataRequest.flush(getCalendarData);
    expect(component.events().length).toEqual(6);
    const calendarEvent = component.events()[0];
    expect(calendarEvent.title).toEqual("La Toussaint");
  });

  it("Should check actual view", () => {
    component.setView(CalendarView.Day);
    expect(component.isCalendarViewMonth()).toEqual(false);
    expect(component.isCalendarViewWeek()).toEqual(false);
    expect(component.isCalendarViewDay()).toEqual(true);
  });

  it("Should update the calendar urls", () => {
    expect(component.calendarUrls()).toEqual([]);
    expect(component.getWidgetConfig()).toEqual(undefined);
    component.onCalendarUrlAdded();
    expect(component.calendarUrls()).toEqual([""]);
    expect(component.getWidgetConfig()).toEqual({ calendarUrls: [""] });
    component.removeCalendarUrl("");
    expect(component.getWidgetConfig()).toEqual(undefined);
  });
});
