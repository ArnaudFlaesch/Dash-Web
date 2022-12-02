import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-ecowatt-widget',
  templateUrl: './ecowatt-widget.component.html',
  styleUrls: ['./ecowatt-widget.component.scss']
})
export class EcowattWidgetComponent {
  @ViewChild('iframeContainer')
  private iframeContainer: ElementRef | undefined;

  public ecowattIframeUrl =
    'https://www.monecowatt.fr/preview-homepage?prevision=1&map=0&ecogestes=0';

  public isWidgetLoaded = true;
  public iframeContainerHeight = 0;
  public iframeContainerWidth = 0;

  constructor(private cdRef: ChangeDetectorRef) {}

  @HostListener('window:resize', ['$event'])
  private onResize(event: Event): void {
    this.resizeWidget();
  }

  public resizeWidget(): void {
    this.iframeContainerHeight =
      this.iframeContainer?.nativeElement.offsetHeight;
    this.iframeContainerWidth = this.iframeContainer?.nativeElement.offsetWidth;
  }

  public refreshWidget(): void {
    this.cdRef.detectChanges();
    this.resizeWidget();
    if (this.iframeContainer) {
      const iframe =
        this.iframeContainer.nativeElement.getElementsByTagName('iframe')[0];
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
