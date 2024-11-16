import { TestBed } from "@angular/core/testing";
import { NotificationsListComponent } from "./notifications-list.component";

describe("NotificationsListComponent", () => {
  let component: NotificationsListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      providers: []
    }).compileComponents();

    const fixture = TestBed.createComponent(NotificationsListComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
