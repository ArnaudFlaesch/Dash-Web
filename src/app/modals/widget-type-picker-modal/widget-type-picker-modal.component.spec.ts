import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { WidgetTypeEnum } from "../../enums/WidgetTypeEnum";
import { IWidgetTypePickerData } from "../../model/IWidgetTypePicker";
import { WidgetTypePickerModalComponent } from "./widget-type-picker-modal.component";
import { WIDGET_TYPE_OPTIONS } from "../../model/WidgetTypeOptions";

describe("WidgetTypePickerModalComponent", () => {
  const data: IWidgetTypePickerData = {
    title: "Ajouter un widget",
    widgetTypes: WIDGET_TYPE_OPTIONS
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        { provide: MatDialogRef, useValue: {} },
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
});
