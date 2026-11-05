import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ModeEnum } from "@widgets/abstract-widget/mode.enum";
import { WIDGET_ID } from "@widgets/widget.tokens";
import { AbstractWidgetComponent } from "./abstract-widget.component";

@Component({
  selector: "dash-test-widget",
  template: `<span class="mode">{{ mode() }}</span>`
})
class TestWidgetComponent extends AbstractWidgetComponent {
  public saveWidgetData(): void {
    this.onWidgetDataSaved();
  }
}

@Component({
  template: `
    <dash-test-widget
      [widgetData]="widgetData()"
      [isFormValid]="isFormValid()"
      (refreshWidgetAction)="refreshCount = refreshCount + 1"
    >
      <ng-template #body>Body</ng-template>
      @if (hasEditComponent()) {
        <ng-template #editComponent>Edit</ng-template>
      }
    </dash-test-widget>
  `,
  imports: [TestWidgetComponent]
})
class HostComponent {
  public readonly widgetData = signal<Record<string, unknown> | undefined>(undefined);
  public readonly isFormValid = signal(false);
  public readonly hasEditComponent = signal(true);
  public refreshCount = 0;
}

describe("AbstractWidgetComponent", () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let widget: TestWidgetComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: WIDGET_ID, useValue: 3 }] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  async function render(): Promise<void> {
    await fixture.whenStable();
    widget = fixture.debugElement.children[0].componentInstance;
  }

  it("Should start in edit mode without data and without refresh when the form is invalid", async () => {
    await render();
    expect(widget.mode()).toEqual(ModeEnum.EDIT);
    expect(widget.isModeEdit()).toBe(true);
    expect(host.refreshCount).toEqual(0);
    expect(fixture.nativeElement.querySelector(".mode").textContent).toEqual(`${ModeEnum.EDIT}`);
  });

  it("Should start in read mode and refresh a widget with valid data", async () => {
    host.widgetData.set({ city: "Paris" });
    host.isFormValid.set(true);
    await render();
    expect(widget.isModeRead()).toBe(true);
    expect(host.refreshCount).toEqual(1);
  });

  it("Should switch between the read, edit and delete modes", async () => {
    host.widgetData.set({ city: "Paris" });
    await render();

    widget.toEditMode();
    expect(widget.isModeEdit()).toBe(true);
    widget.cancelEdition();
    expect(widget.isModeRead()).toBe(true);
    widget.toDeleteMode();
    expect(widget.isModeDelete()).toBe(true);
    widget.toReadMode();
    expect(widget.isModeRead()).toBe(true);
  });

  it("Should stay in read mode without edit component", async () => {
    host.widgetData.set({ city: "Paris" });
    host.hasEditComponent.set(false);
    await render();
    widget.toEditMode();
    expect(widget.isModeRead()).toBe(true);
  });

  it("Should go to read mode and refresh once the data is saved", async () => {
    await render();
    host.widgetData.set({ city: "Paris" });
    host.isFormValid.set(true);
    await fixture.whenStable();

    widget.saveWidgetData();
    expect(widget.isModeRead()).toBe(true);
    expect(host.refreshCount).toEqual(1);
  });
});
