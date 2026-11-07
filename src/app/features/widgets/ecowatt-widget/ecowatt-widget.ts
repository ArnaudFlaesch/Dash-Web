import { Component, ElementRef, viewChild } from "@angular/core";
import { MatIcon } from "@angular/material/icon";
import { Widget } from "@widgets/widget/widget";

@Component({
  selector: "dash-ecowatt-widget",
  templateUrl: "./ecowatt-widget.html",
  styleUrl: "./ecowatt-widget.scss",
  imports: [Widget, MatIcon]
})
export class EcowattWidget {
  protected readonly labels = {
    title: "Ecowatt",
    iframeTitle: "Prévisions Ecowatt"
  };

  public readonly iframe = viewChild<ElementRef<HTMLIFrameElement>>("iframe");

  public refreshWidget(): void {
    const iframe = this.iframe()?.nativeElement;
    if (iframe) {
      // Reassigning the source reloads the iframe
      const src = iframe.src;
      iframe.src = src;
    }
  }
}
