import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  viewChild
} from "@angular/core";
import { SafePipe } from "../../pipes/safe.pipe";
import { MatIcon } from "@angular/material/icon";
import { WidgetComponent } from "../widget/widget.component";

@Component({
  selector: "dash-ecowatt-widget",
  templateUrl: "./ecowatt-widget.component.html",
  styleUrls: ["./ecowatt-widget.component.scss"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WidgetComponent, MatIcon, SafePipe]
})
export class EcowattWidgetComponent implements AfterViewInit {
  public readonly iframeContainer = viewChild<ElementRef>("iframeContainer");

  public ecowattIframeUrl =
    "https://www.monecowatt.fr/preview-homepage?prevision=1&map=0&ecogestes=0";

  public isWidgetLoaded = true;
  public iframeContainerHeight = 0;
  public iframeContainerWidth = 0;
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  @HostListener("window:resize", ["$event"])
  public onResize(): void {
    this.resizeWidget();
  }

  public ngAfterViewInit(): void {
    this.resizeWidget();
  }

  public resizeWidget(): void {
    const iframeContainer = this.iframeContainer();
    if (iframeContainer) {
      this.iframeContainerHeight = iframeContainer?.nativeElement.offsetHeight;
      this.iframeContainerWidth = iframeContainer?.nativeElement.offsetWidth;
      this.changeDetectorRef.detectChanges();
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
