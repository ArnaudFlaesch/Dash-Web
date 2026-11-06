import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { vi } from "vitest";
import { ConfirmModal } from "./confirm-modal";

describe("ConfirmModal", () => {
  let component: ConfirmModal;
  let fixture: ComponentFixture<ConfirmModal>;
  let closeSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    closeSpy = vi.fn();
    await TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        { provide: MAT_DIALOG_DATA, useValue: { confirmMessage: "test" } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function getButtons(): HTMLButtonElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("button"));
  }

  it("Should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("Should display the confirmation message", () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector("h1")?.textContent?.trim()).toEqual("Confirmation");
    expect(element.querySelector("mat-dialog-content")?.textContent?.trim()).toEqual("test");
    expect(getButtons().map((button) => button.textContent?.trim())).toEqual([
      "Fermer",
      "Confirmer"
    ]);
  });

  it("Should close the modal with true when the action is confirmed", () => {
    getButtons()[1].click();
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it("Should close the modal without result when it is closed", () => {
    getButtons()[0].click();
    expect(closeSpy).toHaveBeenCalledWith("");
  });
});
