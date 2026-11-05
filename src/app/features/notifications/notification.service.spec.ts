import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { INotification, NotificationTypeEnum } from "@features/notifications/notification.model";
import { IPage } from "@shared/models/page.model";
import { NotificationService } from "./notification.service";

describe("NotificationService", () => {
  let notificationService: NotificationService;
  let httpTestingController: HttpTestingController;

  const notificationsUrl = `${environment.backend_url}/notifications`;
  const notification: INotification = {
    id: 1,
    message: "username: Connexion utilisateur",
    notificationDate: "2026-11-04T10:00:00",
    notificationType: NotificationTypeEnum.INFO,
    isRead: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    notificationService = TestBed.inject(NotificationService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("Should get the notifications", () => {
    const page: IPage<INotification> = {
      content: [notification],
      totalPages: 1,
      totalElements: 1,
      last: true,
      size: 1,
      number: 0
    };
    let response: IPage<INotification> | undefined;
    notificationService.getNotifications().subscribe((notifications) => (response = notifications));
    const request = httpTestingController.expectOne(`${notificationsUrl}/`);
    expect(request.request.method).toEqual("GET");
    request.flush(page);
    expect(response).toEqual(page);
  });

  it("Should mark notifications as read", () => {
    notificationService.markNotificationAsRead([1, 2]).subscribe();
    const request = httpTestingController.expectOne(`${notificationsUrl}/markNotificationAsRead`);
    expect(request.request.method).toEqual("PUT");
    expect(request.request.body).toEqual({ notificationIds: [1, 2] });
    request.flush([{ ...notification, isRead: true }]);
  });
});
