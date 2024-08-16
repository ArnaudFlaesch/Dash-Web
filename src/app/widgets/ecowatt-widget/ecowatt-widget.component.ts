import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject
} from '@angular/core';
import { SafePipe } from '../../pipes/safe.pipe';
import { MatIcon } from '@angular/material/icon';
import { WidgetComponent } from '../widget/widget.component';

@Component({
  selector: 'dash-ecowatt-widget',
  templateUrl: './ecowatt-widget.component.html',
  styleUrls: ['./ecowatt-widget.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WidgetComponent, MatIcon, SafePipe]
})
export class EcowattWidgetComponent implements AfterViewInit {
  private cdRef = inject(ChangeDetectorRef);

  @ViewChild('iframeContainer')
  private iframeContainer: ElementRef | undefined;

  public ecowattIframeUrl =
    'https://www.monecowatt.fr/preview-homepage?prevision=1&map=0&ecogestes=0';

  public isWidgetLoaded = true;
  public iframeContainerHeight = 0;
  public iframeContainerWidth = 0;

  @HostListener('window:resize', ['$event'])
  private onResize(): void {
    this.resizeWidget();
  }

  public ngAfterViewInit(): void {
    this.resizeWidget();
  }

  public resizeWidget(): void {
    this.iframeContainerHeight = this.iframeContainer?.nativeElement.offsetHeight;
    this.iframeContainerWidth = this.iframeContainer?.nativeElement.offsetWidth;
  }

  public refreshWidget(): void {
    this.cdRef.detectChanges();
    this.resizeWidget();
    if (this.iframeContainer) {
      const iframe = this.iframeContainer.nativeElement.getElementsByTagName('iframe')[0];
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
