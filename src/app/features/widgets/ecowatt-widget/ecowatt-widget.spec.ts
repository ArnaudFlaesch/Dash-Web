import { WIDGET_ID } from "@widgets/widget.tokens";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EcowattWidget } from "./ecowatt-widget";

const ECOWATT_IFRAME_URL =
  "https://www.monecowatt.fr/preview-homepage?prevision=1&map=0&ecogestes=0";

describe("EcowattWidget", () => {
  let component: EcowattWidget;
  let fixture: ComponentFixture<EcowattWidget>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: WIDGET_ID, useValue: 1 }]
    }).compileComponents();

    fixture = TestBed.createComponent(EcowattWidget);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it("should create", () => {
    component.refreshWidget();
    expect(component.iframeContainerHeight()).toBeGreaterThanOrEqual(0);
  });

  /** Simulates the size of the iframe container, which has no layout in the test DOM. */
  function setContainerSize(width: number, height: number): void {
    const container = element.querySelector<HTMLElement>("#ecowatt-info-container")!;
    Object.defineProperty(container, "offsetWidth", { configurable: true, value: width });
    Object.defineProperty(container, "offsetHeight", { configurable: true, value: height });
  }

  function getIframe(): HTMLIFrameElement | null {
    return element.querySelector<HTMLIFrameElement>("iframe");
  }

  it("Should display the Ecowatt iframe in read mode", async () => {
    await fixture.whenStable();
    expect(element.querySelector(".widget-read-mode")).toBeTruthy();
    expect(element.querySelector(".ecowatt-widget-header")?.textContent).toEqual(
      component.labels.title
    );
    expect(element.querySelector(".edit-button")).toBeNull();
    expect(getIframe()?.src).toEqual(ECOWATT_IFRAME_URL);
    expect(getIframe()?.title).toEqual(component.labels.iframeTitle);
  });

  it("Should resize the iframe to its container when the window is resized", async () => {
    await fixture.whenStable();
    setContainerSize(400, 300);
    window.dispatchEvent(new Event("resize"));
    await fixture.whenStable();

    expect(component.iframeContainerWidth()).toEqual(400);
    expect(component.iframeContainerHeight()).toEqual(300);
    expect(getIframe()?.getAttribute("width")).toEqual("400");
    expect(getIframe()?.getAttribute("height")).toEqual("300");
  });

  it("Should resize and reload the iframe when the widget is refreshed", async () => {
    await fixture.whenStable();
    setContainerSize(500, 350);
    const iframe = getIframe()!;
    let srcAssignments = 0;
    const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "src")!;
    Object.defineProperty(iframe, "src", {
      configurable: true,
      get: () => srcDescriptor.get!.call(iframe),
      set: (value: string) => {
        srcAssignments++;
        srcDescriptor.set!.call(iframe, value);
      }
    });

    element.querySelector<HTMLButtonElement>(".refresh-button")?.click();
    await fixture.whenStable();

    expect(component.iframeContainerHeight()).toEqual(350);
    expect(component.iframeContainerWidth()).toEqual(500);
    expect(srcAssignments).toEqual(1);
    expect(iframe.src).toEqual(ECOWATT_IFRAME_URL);
  });
});
