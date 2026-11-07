import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WidgetMode } from "@widgets/abstract-widget/widget-mode";
import { WIDGET_ID } from "@widgets/widget-tokens";
import { AbstractWidget } from "./abstract-widget";

/** Test widget rendering its mode and a button for each mode transition of the base class. */
@Component({
  selector: "dash-test-widget",
  template: `
    @if (isModeRead()) {
      <span class="read-mode"></span>
    }
    @if (isModeEdit()) {
      <span class="edit-mode"></span>
    }
    @if (isModeDelete()) {
      <span class="delete-mode"></span>
    }
    <button class="to-edit-mode" (click)="toEditMode()">Edit</button>
    <button class="to-read-mode" (click)="toReadMode()">Read</button>
    <button class="to-delete-mode" (click)="toDeleteMode()">Delete</button>
    <button class="cancel-edition" (click)="cancelEdition()">Cancel</button>
    <button class="refresh" (click)="refreshWidget()">Refresh</button>
  `
})
class TestWidget extends AbstractWidget {
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
      (editionCancelled)="cancelCount = cancelCount + 1"
    >
      <ng-template #body>Body</ng-template>
      @if (hasEditComponent()) {
        <ng-template #editComponent>Edit</ng-template>
      }
    </dash-test-widget>
  `,
  imports: [TestWidget]
})
class Host {
  public readonly widgetData = signal<Record<string, unknown> | undefined>(undefined);
  public readonly isFormValid = signal(false);
  public readonly hasEditComponent = signal(true);
  public refreshCount = 0;
  public cancelCount = 0;
}

describe("AbstractWidget", () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let widget: TestWidget;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: WIDGET_ID, useValue: 3 }] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
  });

  async function render(): Promise<void> {
    await fixture.whenStable();
    widget = fixture.debugElement.children[0].componentInstance;
  }

  async function click(selector: string): Promise<void> {
    element.querySelector<HTMLButtonElement>(selector)?.click();
    await fixture.whenStable();
  }

  function expectMode(mode: WidgetMode): void {
    expect(element.querySelector(".read-mode") !== null).toBe(mode === WidgetMode.READ);
    expect(element.querySelector(".edit-mode") !== null).toBe(mode === WidgetMode.EDIT);
    expect(element.querySelector(".delete-mode") !== null).toBe(mode === WidgetMode.DELETE);
  }

  it("Should start in edit mode without data and without refresh when the form is invalid", async () => {
    await render();
    expectMode(WidgetMode.EDIT);
    expect(host.refreshCount).toEqual(0);
  });

  it("Should start in read mode and refresh a widget with valid data", async () => {
    host.widgetData.set({ city: "Paris" });
    host.isFormValid.set(true);
    await render();
    expectMode(WidgetMode.READ);
    expect(host.refreshCount).toEqual(1);
  });

  it("Should only refresh a widget with a valid form", async () => {
    await render();
    await click(".refresh");
    expect(host.refreshCount).toEqual(0);

    host.isFormValid.set(true);
    await fixture.whenStable();
    await click(".refresh");
    expect(host.refreshCount).toEqual(1);
  });

  it("Should switch between the read, edit and delete modes", async () => {
    host.widgetData.set({ city: "Paris" });
    await render();

    await click(".to-edit-mode");
    expectMode(WidgetMode.EDIT);
    await click(".cancel-edition");
    expectMode(WidgetMode.READ);
    await click(".to-delete-mode");
    expectMode(WidgetMode.DELETE);
    await click(".to-read-mode");
    expectMode(WidgetMode.READ);
  });

  it("Should stay in edit mode when going to read mode without data", async () => {
    await render();
    await click(".to-delete-mode");
    expectMode(WidgetMode.DELETE);
    await click(".to-read-mode");
    expectMode(WidgetMode.EDIT);
  });

  it("Should stay in read mode without edit component", async () => {
    host.widgetData.set({ city: "Paris" });
    host.hasEditComponent.set(false);
    await render();
    await click(".to-edit-mode");
    expectMode(WidgetMode.READ);
  });

  it("Should go to read mode and refresh once the data is saved", async () => {
    await render();
    host.widgetData.set({ city: "Paris" });
    host.isFormValid.set(true);
    await fixture.whenStable();

    widget.saveWidgetData();
    await fixture.whenStable();
    expectMode(WidgetMode.READ);
    expect(host.refreshCount).toEqual(1);
  });

  it("Should know that the data of a widget created with data is saved", async () => {
    host.widgetData.set({ city: "Paris" });
    await render();
    expect(widget.isWidgetDataSaved()).toBe(true);
  });

  it("Should only know that the data of a new widget is saved once it is saved", async () => {
    await render();
    expect(widget.isWidgetDataSaved()).toBe(false);
    host.widgetData.set({ city: "Paris" });
    host.isFormValid.set(true);
    await fixture.whenStable();
    expect(widget.isWidgetDataSaved()).toBe(false);

    widget.saveWidgetData();
    expect(widget.isWidgetDataSaved()).toBe(true);
  });

  it("Should notify the cancellation of the edition", async () => {
    host.widgetData.set({ city: "Paris" });
    await render();
    await click(".to-edit-mode");
    await click(".cancel-edition");
    expect(host.cancelCount).toEqual(1);
  });
});
