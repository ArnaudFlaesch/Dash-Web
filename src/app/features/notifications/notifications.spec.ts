import { startOfYesterday } from "date-fns";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { NotificationsList } from "./notifications-list/notifications-list";
import { IPage } from "@shared/models/page.model";
import { environment } from "@environments/environment";
import { INotification, NotificationTypeEnum } from "@features/notifications/notification.model";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { WidgetService } from "@widgets/widget-service";
import { Notifications } from "./notifications";
import { provideHttpClient } from "@angular/common/http";

describe("Notifications", () => {
  let component: Notifications;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
      // Not rendered, so that the resources are only loaded by the test, not by the child components
      .overrideTemplate(Notifications, "")
      .compileComponents();

    const fixture = TestBed.createComponent(Notifications);
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

  const notificationDate = new Date();
  const notificationsData = {
    content: [
      {
        id: 1,
        message: "username: Connexion utilisateur",
        notificationType: NotificationTypeEnum.WARN,
        notificationDate: notificationDate.toString(),
        isRead: false
      },
      {
        id: 2,
        message: "username: Action user",
        notificationType: NotificationTypeEnum.INFO,
        notificationDate: notificationDate.toString(),
        isRead: false
      },
      {
        id: 3,
        message: "username: Action user",
        notificationType: NotificationTypeEnum.INFO,
        notificationDate: startOfYesterday(),
        isRead: true
      }
    ],
    totalPages: 1,
    totalElements: 3,
    last: true,
    size: 1,
    number: 0
  } as IPage<INotification>;

  it("should create component and get notifications", async () => {
    TestBed.tick();
    const notificationsRequest = httpTestingController.expectOne(
      environment.backend_url + "/notifications/"
    );
    notificationsRequest.flush(notificationsData);
    await flushResources();

    expect(component.notificationsFromDatabase()).toEqual(notificationsData.content);
    expect(component.notificationsToDisplay()[0].notificationTypeToDisplay).toEqual("warning");
    expect(component.notificationsToDisplay()[1].notificationTypeToDisplay).toEqual("info");
    expect(component.notificationsToDisplay()[1].notificationTypeToDisplay).toEqual("info");
    expect(component.unreadNotificationsForBadge()).toEqual(2);
  });

  it("Should mark all notifications as read", async () => {
    TestBed.tick();
    const notificationsRequest = httpTestingController.expectOne(
      environment.backend_url + "/notifications/"
    );
    notificationsRequest.flush(notificationsData);
    await flushResources();

    component.markAllNotificationsAsRead();

    const markNotificationAsReadRequest = httpTestingController.expectOne(
      environment.backend_url + "/notifications/markNotificationAsRead"
    );
    const updatedNotificationsData = notificationsData.content.map((notif) => {
      return { ...notif, ...{ isRead: true } };
    });
    markNotificationAsReadRequest.flush(updatedNotificationsData);

    expect(component.unreadNotificationsForBadge()).toEqual(0);
  });

  /** Loads the notifications, then answers the request sent by the given action. */
  async function loadNotifications(content: INotification[]): Promise<void> {
    TestBed.tick();
    httpTestingController
      .expectOne(environment.backend_url + "/notifications/")
      .flush({ ...notificationsData, content });
    await flushResources();
  }

  const today = new Date(2026, 10, 4, 9, 30);
  const twoDaysAgo = new Date(2026, 10, 2, 18, 15);
  const notifications: INotification[] = [
    {
      id: 1,
      message: "Older notification",
      notificationType: NotificationTypeEnum.INFO,
      notificationDate: twoDaysAgo.toISOString(),
      isRead: false
    },
    {
      id: 2,
      message: "Today notification",
      notificationType: NotificationTypeEnum.WARN,
      notificationDate: today.toISOString(),
      isRead: false
    }
  ];

  it("Should display the time of today's notifications and the day of the older ones", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 4, 12, 0));
    await loadNotifications(notifications);
    expect(component.notificationsToDisplay().map((n) => n.notificationDateToDisplay)).toEqual([
      "02/11",
      "09:30"
    ]);
    vi.useRealTimers();
  });

  it("Should mark one notification as read and sort the notifications by date", async () => {
    await loadNotifications(notifications);
    component.markNotificationAsRead(1);

    const request = httpTestingController.expectOne(
      environment.backend_url + "/notifications/markNotificationAsRead"
    );
    expect(request.request.body).toEqual({ notificationIds: [1] });
    request.flush([{ ...notifications[0], isRead: true }]);

    expect(component.notificationsFromDatabase().map((n) => [n.id, n.isRead])).toEqual([
      [2, false],
      [1, true]
    ]);
    expect(component.unreadNotificationsForBadge()).toEqual(1);
  });

  it("Should display an error when the notifications can't be loaded", async () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    TestBed.tick();
    httpTestingController
      .expectOne(environment.backend_url + "/notifications/")
      .flush(null, { status: 500, statusText: "Server error" });
    await flushResources();
    expect(component.notificationsFromDatabase()).toEqual([]);
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des notifications."
    );
  });

  it("Should display an error when a notification can't be marked as read", async () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    await loadNotifications(notifications);
    component.markNotificationAsRead(1);
    httpTestingController
      .expectOne(environment.backend_url + "/notifications/markNotificationAsRead")
      .flush(null, { status: 500, statusText: "Server error" });
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors du traitement de la requête."
    );
    expect(component.unreadNotificationsForBadge()).toEqual(2);
  });

  it("Should reload the notifications when the widgets are refreshed", async () => {
    await loadNotifications(notifications);
    TestBed.inject(WidgetService).refreshAllWidgets();
    TestBed.tick();
    httpTestingController
      .expectOne(environment.backend_url + "/notifications/")
      .flush({ ...notificationsData, content: [] });
    await flushResources();
    expect(component.notificationsFromDatabase()).toEqual([]);
  });
});

describe("Notifications template", () => {
  let fixture: ComponentFixture<Notifications>;
  let httpTestingController: HttpTestingController;

  const notifications: INotification[] = [
    {
      id: 1,
      message: "username: Connexion utilisateur",
      notificationType: NotificationTypeEnum.WARN,
      notificationDate: new Date().toISOString(),
      isRead: false
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Notifications);
    httpTestingController = TestBed.inject(HttpTestingController);
    TestBed.tick();
    httpTestingController.expectOne(environment.backend_url + "/notifications/").flush({
      content: notifications,
      totalPages: 1,
      totalElements: 1,
      last: true,
      size: 1,
      number: 0
    });
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  function getList(): NotificationsList {
    return fixture.debugElement.query(
      (debugElement) => debugElement.name === "dash-notifications-list"
    ).componentInstance as NotificationsList;
  }

  it("Should pass the notifications and the unread count to the list", () => {
    expect(getList().unreadNotificationsForBadge()).toEqual(1);
    expect(getList().notificationsList()).toEqual(
      fixture.componentInstance.notificationsToDisplay()
    );
  });

  it("Should mark the notifications as read when the list asks to", () => {
    getList().markNotificationAsReadEvent.emit(1);
    const request = httpTestingController.expectOne(
      environment.backend_url + "/notifications/markNotificationAsRead"
    );
    expect(request.request.body).toEqual({ notificationIds: [1] });
    request.flush([{ ...notifications[0], isRead: true }]);

    getList().markAllNotificationsAsReadEvent.emit();
    httpTestingController
      .expectOne(environment.backend_url + "/notifications/markNotificationAsRead")
      .flush([]);
  });
});
