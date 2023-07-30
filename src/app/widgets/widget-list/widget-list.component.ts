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
  SimpleChanges,
  ViewChildren,
  ViewContainerRef
} from '@angular/core';
import { WidgetTypeEnum } from '../../enums/WidgetTypeEnum';
import { CalendarWidgetComponent } from '../calendar-widget/calendar-widget.component';
import { RssWidgetComponent } from '../rss-widget/rss-widget.component';
import { SteamWidgetComponent } from '../steam-widget/steam-widget.component';
import { WeatherWidgetComponent } from '../weather-widget/weather-widget.component';
import { IWidgetConfig } from './../../model/IWidgetConfig';
import { StravaWidgetComponent } from '../strava-widget/strava-widget.component';
import { WorkoutWidgetComponent } from '../workout-widget/workout-widget.component';
import { AirParifWidgetComponent } from '../airparif-widget/airparif-widget.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { EcowattWidgetComponent } from '../ecowatt-widget/ecowatt-widget.component';
import { IncidentWidgetComponent } from '../incident-widget/incident-widget.component';

@Component({
  selector: 'app-widget-list',
  templateUrl: './widget-list.component.html',
  styleUrls: ['./widget-list.component.scss']
})
export class WidgetListComponent implements OnChanges, AfterViewInit {
  @Input() widgetList: IWidgetConfig[] = [];
  @Input() toggleEditMode = false;
  @Output() updateWidgetsOrderEvent = new EventEmitter<IWidgetConfig[]>();

  @ViewChildren('dynamic', { read: ViewContainerRef })
  private widgetTargets: QueryList<ViewContainerRef> | undefined;

  private isTwitterWidgetInList = false;

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['widgetList']) {
      this.cdRef.detectChanges();
      this.createWidgets();
    }
  }

  ngAfterViewInit(): void {
    if (this.isTwitterWidgetInList) {
      this.initTwitterWidget();
    }
  }

  public drop(event: CdkDragDrop<IWidgetConfig[]>): void {
    moveItemInArray(this.widgetList, event.previousIndex, event.currentIndex);
    const updatedWidgets = this.widgetList.map((widget: IWidgetConfig, index: number) => {
      widget.widgetOrder = index;
      return widget;
    });
    this.updateWidgetsOrderEvent.emit(updatedWidgets);
  }

  private createWidgets(): void {
    if (this.widgetTargets) {
      this.isTwitterWidgetInList = false;
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
          case WidgetTypeEnum.WEATHER: {
            component = target.createComponent(WeatherWidgetComponent, {
              injector: injector
            });
            component.instance.city = widgetData ? (widgetData['city'] as string) : null;
            break;
          }
          case WidgetTypeEnum.RSS: {
            component = target.createComponent(RssWidgetComponent, {
              injector: injector
            });
            component.instance.urlFeed = widgetData ? (widgetData['url'] as string) : null;
            component.instance.readArticles = widgetData?.['readArticlesGuids']
              ? (widgetData['readArticlesGuids'] as string[])
              : [];
            break;
          }
          case WidgetTypeEnum.CALENDAR: {
            component = target.createComponent(CalendarWidgetComponent, {
              injector: injector
            });
            component.instance.calendarUrls = widgetData?.['calendarUrls']
              ? (widgetData['calendarUrls'] as string[])
              : [];
            break;
          }
          case WidgetTypeEnum.STRAVA: {
            target.createComponent(StravaWidgetComponent, {
              injector: injector
            });
            break;
          }
          case WidgetTypeEnum.STEAM: {
            component = target.createComponent(SteamWidgetComponent, {
              injector: injector
            });
            component.instance.steamUserId = widgetData?.['steamUserId']
              ? (widgetData['steamUserId'] as string)
              : undefined;
            break;
          }
          case WidgetTypeEnum.WORKOUT: {
            target.createComponent(WorkoutWidgetComponent, {
              injector: injector
            });
            break;
          }
          case WidgetTypeEnum.AIRPARIF: {
            component = target.createComponent(AirParifWidgetComponent, {
              injector: injector
            });
            component.instance.airParifApiKey = widgetData
              ? (widgetData['airParifApiKey'] as string)
              : undefined;
            component.instance.communeInseeCode = widgetData
              ? (widgetData['communeInseeCode'] as string)
              : undefined;
            break;
          }
          /* @TODO Fix or remove Twitter widget
          case WidgetTypeEnum.TWITTER: {
            this.isTwitterWidgetInList = true;
            component = target.createComponent(TwitterWidgetComponent, {
              injector: injector
            });
            component.instance.selectedTwitterHandle = widgetData
              ? (widgetData['twitterHandle'] as string)
              : undefined;
            break;
          }
          */
          case WidgetTypeEnum.ECOWATT: {
            target.createComponent(EcowattWidgetComponent, {
              injector: injector
            });
            break;
          }
          case WidgetTypeEnum.INCIDENT: {
            component = target.createComponent(IncidentWidgetComponent, {
              injector: injector
            });
            component.instance.incidentName = widgetData
              ? (widgetData['incidentName'] as string)
              : undefined;
            break;
          }
        }
      });
    }
  }

  /* eslint-disable */
  private initTwitterWidget(): void {
    (<any>window).twttr = (function (d, s, id) {
      const fjs: any = d.getElementsByTagName(s)[0],
        t = (<any>window).twttr || {};
      if (d.getElementById(id)) return t;
      const js: any = d.createElement(s);
      js.id = id;
      js.src = 'https://platform.twitter.com/widgets.js';
      fjs?.parentNode?.insertBefore(js, fjs);

      t._e = [];
      t.ready = function (f: any) {
        t._e.push(f);
      };

      return t;
    })(document, 'script', 'twitter-wjs');

    if ((<any>window).twttr.ready()) {
      (<any>window).twttr.widgets.load();
    }
  }
  /* eslint-enable */
}
