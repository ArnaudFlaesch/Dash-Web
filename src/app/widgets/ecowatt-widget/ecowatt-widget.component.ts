import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-ecowatt-widget',
  templateUrl: './ecowatt-widget.component.html',
  styleUrls: ['./ecowatt-widget.component.scss']
})
export class EcowattWidgetComponent {
  @ViewChild('iframeContainer')
  private iframeContainer: ElementRef | undefined;

  public isWidgetLoaded = true;

  public refreshWidget(): void {
    console.log('');
    /*
    this.cdRef.detectChanges();
    if (this.timeline) {
      const iframe =
        this.timeline.nativeElement.getElementsByTagName('iframe')[0];
      if (iframe) {
        const src = iframe.src;
        iframe.src = src;
      }
    }
    */
  }

  public getIframeHeight(): number {
    return this.iframeContainer?.nativeElement.offsetHeight;
  }

  public getIframeWidth(): number {
    return this.iframeContainer?.nativeElement.offsetWidth;
  }

  public getWidgetData(): Record<string, never> {
    return {};
  }
}
