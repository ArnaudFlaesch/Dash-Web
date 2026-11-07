import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Mock, vi } from "vitest";
import { DeleteWidget } from "./delete-widget";

describe("DeleteWidget", () => {
  let component: DeleteWidget;
  let fixture: ComponentFixture<DeleteWidget>;
  let element: HTMLElement;
  let cancelSpy: Mock<() => void>;
  let validateSpy: Mock<() => void>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: []
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteWidget);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
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
    expect(element.querySelector("h4")?.textContent).toEqual(
      "Êtes-vous sûr de vouloir supprimer ce widget ?"
    );
    expect(element.querySelector(".cancel-button")?.textContent?.trim()).toEqual("Annuler");
    expect(element.querySelector(".validate-deletion-button")?.textContent?.trim()).toEqual(
      "Supprimer"
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
