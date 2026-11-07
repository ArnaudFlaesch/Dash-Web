import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { vi } from "vitest";
import { WidgetType } from "@widgets/widget-type";
import { WidgetTypePickerData } from "@widgets/widget-type-picker-modal/widget-type-picker-data";
import { WidgetTypePickerModal } from "./widget-type-picker-modal";
import { WIDGET_TYPE_OPTIONS } from "@widgets/widget-type-picker-modal/widget-type-options";

describe("WidgetTypePickerModal", () => {
  let closeSpy: ReturnType<typeof vi.fn>;

  const data: WidgetTypePickerData = {
    title: "Ajouter un widget",
    widgetTypes: WIDGET_TYPE_OPTIONS
  };

  beforeEach(async () => {
    closeSpy = vi.fn();
    await TestBed.configureTestingModule({
      providers: [
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();
  });

  it("Should display a tile for each widget type", async () => {
    const fixture = TestBed.createComponent(WidgetTypePickerModal);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector("h1")?.textContent).toEqual("Ajouter un widget");
    expect(element.querySelectorAll(".widget-type-tile")).toHaveLength(WIDGET_TYPE_OPTIONS.length);
  });

  it("Should offer every type of widget", () => {
    const widgetTypeKeys = Object.keys(WidgetType).filter((key) => Number.isNaN(Number(key)));
    expect(WIDGET_TYPE_OPTIONS.map((option) => option.type).toSorted()).toEqual(
      widgetTypeKeys.toSorted()
    );
  });

  it("Should display the icon and the label of each widget type", async () => {
    const fixture = TestBed.createComponent(WidgetTypePickerModal);
    await fixture.whenStable();
    const tiles = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        ".widget-type-tile"
      )
    );
    expect(tiles.map((tile) => tile.id)).toEqual(WIDGET_TYPE_OPTIONS.map((option) => option.type));
    expect(tiles.map((tile) => tile.querySelector("mat-icon")?.textContent?.trim())).toEqual(
      WIDGET_TYPE_OPTIONS.map((option) => option.icon)
    );
    expect(tiles.map((tile) => tile.querySelector("span")?.textContent?.trim())).toEqual(
      WIDGET_TYPE_OPTIONS.map((option) => option.label)
    );
  });

  it("Should close the modal with the selected widget type", async () => {
    const fixture = TestBed.createComponent(WidgetTypePickerModal);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>("#RSS")?.click();
    expect(closeSpy).toHaveBeenCalledWith("RSS");
  });

  it("Should close the modal without selecting a widget type", async () => {
    const fixture = TestBed.createComponent(WidgetTypePickerModal);
    await fixture.whenStable();
    const closeButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      "mat-dialog-actions button"
    );
    expect(closeButton?.textContent?.trim()).toEqual("Fermer");
    closeButton?.click();
    expect(closeSpy).toHaveBeenCalledWith("");
  });
});
