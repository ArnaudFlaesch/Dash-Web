import { startOfYesterday } from "date-fns";

import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";
import { NotificationsList } from "./notifications-list/notifications-list";
import { Page } from "@shared/pagination/page";
import { environment } from "@environments/environment";
import { AppNotification, NotificationType } from "@features/notifications/app-notification";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { WidgetService } from "@widgets/widget-service";
import { Notifications } from "./notifications";
import { provideHttpClient } from "@angular/common/http";

describe("Notifications", () => {
  let fixture: ComponentFixture<Notifications>;
  let httpTestingController: HttpTestingController;

  const notificationsUrl = environment.backend_url + "/notifications/";
  const markAsReadUrl = environment.backend_url + "/notifications/markNotificationAsRead";

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(Notifications);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  /** Lets the resources receive the flushed responses, then renders the result. */
  async function flushResources(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    await fixture.whenStable();
  }

  /** The child list, whose inputs hold what the component displays. */
  function getList(): NotificationsList {
    return fixture.debugElement.query(
      (debugElement) => debugElement.name === "dash-notifications-list"
    ).componentInstance as NotificationsList;
  }

  const notificationDate = new Date();
  const notificationsData = {
    content: [
      {
        id: 1,
        message: "username: Connexion utilisateur",
        notificationType: NotificationType.WARN,
        notificationDate: notificationDate.toString(),
        isRead: false
      },
      {
        id: 2,
        message: "username: Action user",
        notificationType: NotificationType.INFO,
        notificationDate: notificationDate.toString(),
        isRead: false
      },
      {
        id: 3,
        message: "username: Action user",
        notificationType: NotificationType.INFO,
        notificationDate: startOfYesterday(),
        isRead: true
      }
    ],
    totalPages: 1,
    totalElements: 3,
    last: true,
    size: 1,
    number: 0
  } as Page<AppNotification>;

  /** Loads the given notifications. */
  async function loadNotifications(content: AppNotification[]): Promise<void> {
    TestBed.tick();
    httpTestingController.expectOne(notificationsUrl).flush({ ...notificationsData, content });
    await flushResources();
  }

  it("should create component and get notifications", async () => {
    await loadNotifications(notificationsData.content);

    const list = getList();
    expect(list.notificationsList()).toMatchObject(notificationsData.content);
    expect(list.notificationsList().map((n) => n.notificationTypeToDisplay)).toEqual([
      "warning",
      "info",
      "info"
    ]);
    expect(list.unreadNotificationsForBadge()).toEqual(2);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(".mat-badge-content")?.textContent
    ).toContain("2");
  });

  it("Should mark all notifications as read", async () => {
    await loadNotifications(notificationsData.content);

    getList().markAllNotificationsAsReadEvent.emit();

    const markNotificationAsReadRequest = httpTestingController.expectOne(markAsReadUrl);
    expect(markNotificationAsReadRequest.request.body).toEqual({ notificationIds: [1, 2] });
    const updatedNotificationsData = notificationsData.content.map((notif) => {
      return { ...notif, ...{ isRead: true } };
    });
    markNotificationAsReadRequest.flush(updatedNotificationsData);
    await fixture.whenStable();

    expect(getList().unreadNotificationsForBadge()).toEqual(0);
  });

  const today = new Date(2026, 10, 4, 9, 30);
  const twoDaysAgo = new Date(2026, 10, 2, 18, 15);
  const notifications: AppNotification[] = [
    {
      id: 1,
      message: "Older notification",
      notificationType: NotificationType.INFO,
      notificationDate: twoDaysAgo.toISOString(),
      isRead: false
    },
    {
      id: 2,
      message: "Today notification",
      notificationType: NotificationType.WARN,
      notificationDate: today.toISOString(),
      isRead: false
    }
  ];

  it("Should display the time of today's notifications and the day of the older ones", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 4, 12, 0));
    await loadNotifications(notifications);
    expect(
      getList()
        .notificationsList()
        .map((n) => n.notificationDateToDisplay)
    ).toEqual(["02/11", "09:30"]);
    vi.useRealTimers();
  });

  it("Should mark one notification as read and sort the notifications by date", async () => {
    await loadNotifications(notifications);
    getList().markNotificationAsReadEvent.emit(1);

    const request = httpTestingController.expectOne(markAsReadUrl);
    expect(request.request.body).toEqual({ notificationIds: [1] });
    request.flush([{ ...notifications[0], isRead: true }]);
    await fixture.whenStable();

    expect(
      getList()
        .notificationsList()
        .map((n) => [n.id, n.isRead])
    ).toEqual([
      [2, false],
      [1, true]
    ]);
    expect(getList().unreadNotificationsForBadge()).toEqual(1);
  });

  it("Should display an error when the notifications can't be loaded", async () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    TestBed.tick();
    httpTestingController
      .expectOne(notificationsUrl)
      .flush(null, { status: 500, statusText: "Server error" });
    await flushResources();
    expect(getList().notificationsList()).toEqual([]);
    expect(getList().unreadNotificationsForBadge()).toEqual(0);
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de la récupération des notifications."
    );
  });

  it("Should display an error when a notification can't be marked as read", async () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    await loadNotifications(notifications);
    getList().markNotificationAsReadEvent.emit(1);
    httpTestingController
      .expectOne(markAsReadUrl)
      .flush(null, { status: 500, statusText: "Server error" });
    await fixture.whenStable();
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors du traitement de la requête."
    );
    expect(getList().unreadNotificationsForBadge()).toEqual(2);
  });

  it("Should reload the notifications when the widgets are refreshed", async () => {
    await loadNotifications(notifications);
    expect(getList().notificationsList()).toHaveLength(2);
    TestBed.inject(WidgetService).refreshAllWidgets();
    TestBed.tick();
    httpTestingController.expectOne(notificationsUrl).flush({ ...notificationsData, content: [] });
    await flushResources();
    expect(getList().notificationsList()).toEqual([]);
  });
});
