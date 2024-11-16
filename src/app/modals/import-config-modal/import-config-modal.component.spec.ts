import { TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { ConfigService } from "./../../services/config.service/config.service";
import { ErrorHandlerService } from "./../../services/error.handler.service";
import { ImportConfigModalComponent } from "./import-config-modal.component";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

describe("ImportConfigModalComponent", () => {
  let component: ImportConfigModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [
        ConfigService,
        ErrorHandlerService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ImportConfigModalComponent);
    component = fixture.componentInstance;
  });

  it("Should create the component", () => {
    expect(component).toBeTruthy();
  });
});
