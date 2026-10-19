import { afterNextRender, Component, ElementRef, signal, viewChild } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { SafePipe } from "../../pipes/safe.pipe";
import { WidgetComponent } from "../widget/widget.component";

@Component({
  selector: "dash-ecowatt-widget",
  templateUrl: "./ecowatt-widget.component.html",
  styleUrl: "./ecowatt-widget.component.scss",
  imports: [WidgetComponent, MatIcon, SafePipe],
  host: { "(window:resize)": "resizeWidget()" }
})
export class EcowattWidgetComponent {
  public readonly iframeContainer = viewChild<ElementRef<HTMLElement>>("iframeContainer");

  public readonly ecowattIframeUrl =
    "https://www.monecowatt.fr/preview-homepage?prevision=1&map=0&ecogestes=0";

  public readonly isWidgetLoaded = signal(true);
  public readonly iframeContainerHeight = signal(0);
  public readonly iframeContainerWidth = signal(0);

  public constructor() {
    afterNextRender(() => this.resizeWidget());
  }

  public resizeWidget(): void {
    const container = this.iframeContainer()?.nativeElement;
    if (container) {
      this.iframeContainerHeight.set(container.offsetHeight);
      this.iframeContainerWidth.set(container.offsetWidth);
    }
  }

  public refreshWidget(): void {
    this.resizeWidget();
    const iframe = this.iframeContainer()?.nativeElement.querySelector("iframe");
    if (iframe) {
      // Reassigning the source reloads the iframe
      const src = iframe.src;
      iframe.src = src;
    }
  }

  public getWidgetData(): Record<string, never> {
    return {};
  }
}
