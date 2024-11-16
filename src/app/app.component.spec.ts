import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { AuthService } from "./services/auth.service/auth.service";
import { ThemeService } from "./services/theme.service/theme.service";
import { provideHttpClient } from "@angular/common/http";

describe("AppComponent", () => {
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), ThemeService]
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it("should create the app", () => {
    expect(component).toBeTruthy();
    expect(component.title).toEqual("Dash");
  });
});
