import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Injector,
  input,
  OnChanges,
  output,
  SimpleChanges,
  viewChildren,
  ViewContainerRef
} from "@angular/core";
import { WidgetTypeEnum } from "../../enums/WidgetTypeEnum";
import { CalendarWidgetComponent } from "../calendar-widget/calendar-widget.component";
import { RssWidgetComponent } from "../rss-widget/rss-widget.component";
import { SteamWidgetComponent } from "../steam-widget/steam-widget.component";
import { WeatherWidgetComponent } from "../weather-widget/weather-widget.component";
import { IWidgetConfig } from "../../model/IWidgetConfig";
import { StravaWidgetComponent } from "../strava-widget/strava-widget.component";
import { WorkoutWidgetComponent } from "../workout-widget/workout-widget.component";
import { AirParifWidgetComponent } from "../airparif-widget/airparif-widget.component";
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { EcowattWidgetComponent } from "../ecowatt-widget/ecowatt-widget.component";
import { IncidentWidgetComponent } from "../incident-widget/incident-widget.component";

@Component({
  selector: "dash-widget-list",
  templateUrl: "./widget-list.component.html",
  styleUrls: ["./widget-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag]
})
export class WidgetListComponent implements OnChanges {
  public readonly widgetList = input.required<IWidgetConfig[]>();
  public readonly toggleEditMode = input(false);
  public readonly updateWidgetsOrderEvent = output<IWidgetConfig[]>();

  public readonly widgetTargets = viewChildren("dynamic", { read: ViewContainerRef });
  private readonly cdRef = inject(ChangeDetectorRef);

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes["widgetList"]) {
      this.cdRef.detectChanges();
      this.createWidgets();
      this.cdRef.detectChanges();
    }
  }

  public drop(event: CdkDragDrop<IWidgetConfig[]>): void {
    const widgetList = this.widgetList();
    moveItemInArray(widgetList, event.previousIndex, event.currentIndex);
    const updatedWidgets = widgetList.map((widget: IWidgetConfig, index: number) => {
      widget.widgetOrder = index;
      return widget;
    });
    this.updateWidgetsOrderEvent.emit(updatedWidgets);
  }

  private createWidgets(): void {
    const widgetTargets = this.widgetTargets();
    if (widgetTargets) {
      widgetTargets.forEach((target, index) => {
        target.detach();
        let component;
        const injector: Injector = Injector.create({
          providers: [
            {
              provide: "widgetId",
              useValue: this.widgetList()[index].id
            }
          ]
        });
        const widgetData = this.widgetList()[index].data;
        switch (this.widgetList()[index].type) {
          case WidgetTypeEnum.WEATHER: {
            component = target.createComponent(WeatherWidgetComponent, {
              injector: injector
            });
            component.instance.city = widgetData?.["city"] as string;
            break;
          }
          case WidgetTypeEnum.RSS: {
            component = target.createComponent(RssWidgetComponent, {
              injector: injector
            });
            component.instance.urlFeed = widgetData?.["url"] as string;
            component.instance.readArticles.set(
              (widgetData?.["readArticlesGuids"] as string[]) ?? []
            );
            break;
          }
          case WidgetTypeEnum.CALENDAR: {
            component = target.createComponent(CalendarWidgetComponent, {
              injector: injector
            });
            component.instance.calendarUrls.set((widgetData?.["calendarUrls"] as string[]) ?? []);
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
            component.instance.steamUserId = widgetData?.["steamUserId"] as string;
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
            component.instance.airParifApiKey.set(widgetData?.["airParifApiKey"] as string);
            component.instance.communeInseeCode.set(widgetData?.["communeInseeCode"] as string);
            break;
          }
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
            component.instance.incidentName = widgetData?.["incidentName"] as string;
            break;
          }
        }
      });
      this.cdRef.detectChanges();
    }
  }
}
