import { TwitterWidgetComponent } from './../twitter-widget/twitter-widget.component';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
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
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-widget-list',
  templateUrl: './widget-list.component.html',
  styleUrls: ['./widget-list.component.scss']
})
export class WidgetListComponent implements OnChanges {
  @Input() widgetList: IWidgetConfig[] = [];
  @Input() toggleEditMode = false;
  @Output() updateWidgetsOrderEvent = new EventEmitter<IWidgetConfig[]>();

  @ViewChildren('dynamic', { read: ViewContainerRef })
  private widgetTargets: QueryList<ViewContainerRef> | undefined;

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['widgetList']) {
      this.cdRef.detectChanges();
      this.createWidgets();
    }
  }

  public drop(event: CdkDragDrop<IWidgetConfig[]>): void {
    moveItemInArray(this.widgetList, event.previousIndex, event.currentIndex);
    const updatedWidgets = this.widgetList.map(
      (widget: IWidgetConfig, index: number) => {
        widget.widgetOrder = index;
        return widget;
      }
    );
    this.updateWidgetsOrderEvent.emit(updatedWidgets);
  }

  private createWidgets(): void {
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
            component = target.createComponent(SteamWidgetComponent, {
              injector: injector
            });
            component.instance.steamUserId =
              widgetData && widgetData['steamUserId']
                ? (widgetData['steamUserId'] as string)
                : undefined;
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
          case WidgetTypes.TWITTER: {
            component = target.createComponent(TwitterWidgetComponent, {
              injector: injector
            });
            component.instance.selectedTwitterHandle = widgetData
              ? (widgetData['twitterHandle'] as string)
              : undefined;
            break;
          }
        }
      });
    }
  }
}
