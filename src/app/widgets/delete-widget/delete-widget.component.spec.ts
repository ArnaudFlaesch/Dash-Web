import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Mock, vi } from "vitest";
import { DeleteWidgetComponent } from "./delete-widget.component";

describe("DeleteWidgetComponent", () => {
  let component: DeleteWidgetComponent;
  let fixture: ComponentFixture<DeleteWidgetComponent>;
  let element: HTMLElement;
  let cancelSpy: Mock<() => void>;
  let validateSpy: Mock<() => void>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      providers: []
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteWidgetComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    cancelSpy = vi.fn();
    validateSpy = vi.fn();
    component.cancelWidgetDeletion.subscribe(cancelSpy);
    component.validateWidgetDeletion.subscribe(validateSpy);
    await fixture.whenStable();
  });

  it("Should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("Should display the confirmation message and the actions", () => {
    expect(element.querySelector("h4")?.textContent).toEqual(component.labels.confirmDeletion);
    expect(element.querySelector(".cancel-button")?.textContent?.trim()).toEqual(
      component.labels.cancel
    );
    expect(element.querySelector(".validate-deletion-button")?.textContent?.trim()).toEqual(
      component.labels.delete
    );
  });

  it("Should emit the cancellation of the deletion", () => {
    element.querySelector<HTMLButtonElement>(".cancel-button")?.click();
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(validateSpy).not.toHaveBeenCalled();
  });

  it("Should emit the validation of the deletion", () => {
    element.querySelector<HTMLButtonElement>(".validate-deletion-button")?.click();
    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(cancelSpy).not.toHaveBeenCalled();
  });
});
