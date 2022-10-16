import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  Output,
  QueryList,
  ViewChildren,
  ViewContainerRef
} from '@angular/core';
import { WidgetTypes } from '../../../app/enums/WidgetsEnum';
import { CalendarWidgetComponent } from '../calendar-widget/calendar-widget.component';
import { RssWidgetComponent } from '../rss-widget/rss-widget.component';
import { SteamWidgetComponent } from '../steam-widget/steam-widget.component';
import { WeatherWidgetComponent } from '../weather-widget/weather-widget.component';
import { IWidgetConfig } from './../../model/IWidgetConfig';
import { StravaWidgetComponent } from '../strava-widget/strava-widget.component';
import { WorkoutWidgetComponent } from '../workout-widget/workout-widget.component';
import { AirParifWidgetComponent } from '../airparif-widget/airparif-widget.component';

@Component({
  selector: 'app-widget-list',
  templateUrl: './widget-list.component.html',
  styleUrls: ['./widget-list.component.scss']
})
export class WidgetListComponent implements AfterViewInit, OnChanges {
  @ViewChildren('dynamic', { read: ViewContainerRef })
  private widgetTargets: QueryList<ViewContainerRef> | undefined;

  @Input() widgetList: IWidgetConfig[] = [];
  @Output() widgetDeletedEvent = new EventEmitter<number>();

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
        target.detach();
        let component;
        const injector: Injector = Injector.create({
          providers: [
            {
              provide: 'widgetId',
              useValue: this.widgetList[index].id
            }
          ]
        });
        const widgetData = this.widgetList[index].data;
        switch (this.widgetList[index].type) {
          case WidgetTypes.WEATHER: {
            component = target.createComponent(WeatherWidgetComponent, {
              injector: injector
            });
            component.instance.city = widgetData
              ? (widgetData['city'] as string)
              : null;
            break;
          }
          case WidgetTypes.RSS: {
            component = target.createComponent(RssWidgetComponent, {
              injector: injector
            });
            component.instance.urlFeed = widgetData
              ? (widgetData['url'] as string)
              : null;
            component.instance.readArticles =
              widgetData && widgetData['readArticlesGuids']
                ? (widgetData['readArticlesGuids'] as string[])
                : [];
            break;
          }
          case WidgetTypes.CALENDAR: {
            component = target.createComponent(CalendarWidgetComponent, {
              injector: injector
            });
            component.instance.calendarUrls =
              widgetData && widgetData['calendarUrls']
                ? (widgetData['calendarUrls'] as string[])
                : [];
            break;
          }
          case WidgetTypes.STRAVA: {
            target.createComponent(StravaWidgetComponent, {
              injector: injector
            });
            break;
          }
          case WidgetTypes.STEAM: {
            target.createComponent(SteamWidgetComponent, {
              injector: injector
            });
            break;
          }
          case WidgetTypes.WORKOUT: {
            target.createComponent(WorkoutWidgetComponent, {
              injector: injector
            });
            break;
          }
          case WidgetTypes.AIRPARIF: {
            component = target.createComponent(AirParifWidgetComponent, {
              injector: injector
            });
            component.instance.airParifApiKey = widgetData
              ? (widgetData['airParifApiKey'] as string)
              : null;
            component.instance.communeInseeCode = widgetData
              ? (widgetData['communeInseeCode'] as string)
              : null;
            break;
          }
        }
      });
    }
  }
}
