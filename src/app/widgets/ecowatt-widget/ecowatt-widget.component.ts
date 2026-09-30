import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  signal,
  viewChild
} from "@angular/core";
import { SafePipe } from "../../pipes/safe.pipe";
import { MatIcon } from "@angular/material/icon";
import { WidgetComponent } from "../widget/widget.component";

@Component({
  selector: "dash-ecowatt-widget",
  templateUrl: "./ecowatt-widget.component.html",
  styleUrls: ["./ecowatt-widget.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WidgetComponent, MatIcon, SafePipe]
})
export class EcowattWidgetComponent {
  public readonly iframeContainer = viewChild<ElementRef>("iframeContainer");

  public ecowattIframeUrl =
    "https://www.monecowatt.fr/preview-homepage?prevision=1&map=0&ecogestes=0";

  public isWidgetLoaded = signal(true);
  public iframeContainerHeight = signal(0);
  public iframeContainerWidth = signal(0);

  public constructor() {
    afterNextRender(() => this.resizeWidget());
  }

  @HostListener("window:resize", [])
  public onResize(): void {
    this.resizeWidget();
  }

  public resizeWidget(): void {
    const iframeContainer = this.iframeContainer();
    if (iframeContainer) {
      this.iframeContainerHeight.set(iframeContainer.nativeElement.offsetHeight);
      this.iframeContainerWidth.set(iframeContainer.nativeElement.offsetWidth);
    }
  }

  public refreshWidget(): void {
    this.resizeWidget();
    const iframeContainer = this.iframeContainer();
    if (iframeContainer) {
      const iframe = iframeContainer.nativeElement.getElementsByTagName("iframe")[0];
      if (iframe) {
        const src = iframe.src;
        iframe.src = src;
      }
    }
  }

  public getWidgetData(): Record<string, never> {
    return {};
  }
}
