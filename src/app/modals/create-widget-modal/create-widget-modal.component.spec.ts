import { TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { CreateWidgetModalComponent } from "./create-widget-modal.component";

describe("CreateWidgetModalComponent", () => {
  let component: CreateWidgetModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      providers: [{ provide: MatDialogRef, useValue: {} }]
    }).compileComponents();

    const fixture = TestBed.createComponent(CreateWidgetModalComponent);
    component = fixture.componentInstance;
  });

  it("Should create the component", () => {
    expect(component).toBeTruthy();
  });
});
