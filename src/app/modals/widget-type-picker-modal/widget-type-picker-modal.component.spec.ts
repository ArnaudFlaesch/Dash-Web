import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { vi } from "vitest";
import { WidgetTypeEnum } from "../../enums/WidgetTypeEnum";
import { IWidgetTypePickerData } from "../../model/IWidgetTypePicker";
import { WidgetTypePickerModalComponent } from "./widget-type-picker-modal.component";
import { WIDGET_TYPE_OPTIONS } from "../../model/WidgetTypeOptions";

describe("WidgetTypePickerModalComponent", () => {
  let closeSpy: ReturnType<typeof vi.fn>;

  const data: IWidgetTypePickerData = {
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
    const fixture = TestBed.createComponent(WidgetTypePickerModalComponent);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector("h1")?.textContent).toEqual("Ajouter un widget");
    expect(element.querySelectorAll(".widget-type-tile")).toHaveLength(WIDGET_TYPE_OPTIONS.length);
  });

  it("Should offer every type of widget", () => {
    const widgetTypeKeys = Object.keys(WidgetTypeEnum).filter((key) => Number.isNaN(Number(key)));
    expect(WIDGET_TYPE_OPTIONS.map((option) => option.type).sort()).toEqual(widgetTypeKeys.sort());
  });

  it("Should display the icon and the label of each widget type", async () => {
    const fixture = TestBed.createComponent(WidgetTypePickerModalComponent);
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
    const fixture = TestBed.createComponent(WidgetTypePickerModalComponent);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>("#RSS")?.click();
    expect(closeSpy).toHaveBeenCalledWith("RSS");
  });

  it("Should close the modal without selecting a widget type", async () => {
    const fixture = TestBed.createComponent(WidgetTypePickerModalComponent);
    await fixture.whenStable();
    const closeButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      "mat-dialog-actions button"
    );
    expect(closeButton?.textContent?.trim()).toEqual(fixture.componentInstance.labels.close);
    closeButton?.click();
    expect(closeSpy).toHaveBeenCalledWith("");
  });
});
