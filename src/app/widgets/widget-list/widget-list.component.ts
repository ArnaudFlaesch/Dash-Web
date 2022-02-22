import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  QueryList,
  ViewChildren,
  ViewContainerRef
} from '@angular/core';
import { WidgetTypes } from 'src/app/enums/WidgetsEnum';
import { RssWidgetComponent } from '../rss-widget/rss-widget.component';
import { WeatherWidgetComponent } from '../weather-widget/weather-widget.component';
import { IWidgetConfig } from './../../model/IWidgetConfig';

@Component({
  selector: 'app-widget-list',
  templateUrl: './widget-list.component.html',
  styleUrls: ['./widget-list.component.scss']
})
export class WidgetListComponent implements AfterViewInit, OnChanges {
  @ViewChildren('dynamic', { read: ViewContainerRef })
  public widgetTargets: QueryList<ViewContainerRef> | undefined;

  @Input() widgetList: IWidgetConfig[] = [];

  constructor(private cdRef: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.createWidgets();
    this.cdRef.detectChanges();
  }

  ngOnChanges() {
    this.cdRef.detectChanges();
    this.createWidgets();
  }

  private createWidgets() {
    if (this.widgetTargets) {
      this.widgetTargets.forEach((target, index) => {
        if (this.widgetList[index].type === WidgetTypes.WEATHER) {
          target.createComponent(WeatherWidgetComponent);
        } else {
          target.createComponent(RssWidgetComponent);
        }
      });
    }
  }
}
