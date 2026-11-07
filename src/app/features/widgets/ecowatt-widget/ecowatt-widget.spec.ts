import { WIDGET_ID } from "@widgets/widget-tokens";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EcowattWidget } from "./ecowatt-widget";

const ECOWATT_IFRAME_URL =
  "https://www.monecowatt.fr/preview-homepage?prevision=1&map=0&ecogestes=0";

describe("EcowattWidget", () => {
  let fixture: ComponentFixture<EcowattWidget>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: WIDGET_ID, useValue: 1 }]
    }).compileComponents();

    fixture = TestBed.createComponent(EcowattWidget);
    element = fixture.nativeElement as HTMLElement;
  });

  function getIframe(): HTMLIFrameElement | null {
    return element.querySelector<HTMLIFrameElement>("iframe");
  }

  it("Should display the Ecowatt iframe in read mode", async () => {
    await fixture.whenStable();
    expect(element.querySelector(".widget-read-mode")).toBeTruthy();
    expect(element.querySelector(".ecowatt-widget-header")?.textContent).toEqual("Ecowatt");
    expect(element.querySelector(".edit-button")).toBeNull();
    expect(getIframe()?.src).toEqual(ECOWATT_IFRAME_URL);
    expect(getIframe()?.title).toEqual("Prévisions Ecowatt");
    // Sized by its style, not by attributes
    expect(getIframe()?.classList).toContain("ecowatt-iframe");
    expect(getIframe()?.hasAttribute("width")).toBe(false);
    expect(getIframe()?.hasAttribute("height")).toBe(false);
  });

  it("Should reload the iframe when the widget is refreshed", async () => {
    await fixture.whenStable();
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

    expect(srcAssignments).toEqual(1);
    expect(iframe.src).toEqual(ECOWATT_IFRAME_URL);
  });
});
