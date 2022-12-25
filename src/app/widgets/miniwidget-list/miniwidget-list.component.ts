import {
  ChangeDetectorRef,
  Component,
  Injector,
  OnInit,
  QueryList,
  ViewChildren,
  ViewContainerRef
} from '@angular/core';
import { WidgetTypeEnum } from '../../enums/WidgetTypeEnum';
import { IMiniWidgetConfig } from '../../model/IMiniWidgetConfig';
import { WeatherMiniWidgetComponent } from '../weather-widget/weather-mini-widget/weather-miniwidget.component';
import { ErrorHandlerService } from 'src/app/services/error.handler.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MiniWidgetService } from 'src/app/services/widget.service/miniwidget.service';
import { CreateMiniWidgetModalComponent } from 'src/app/modals/create-mini-widget-modal/create-mini-widget-modal.component';

@Component({
  selector: 'app-miniwidget-list',
  templateUrl: './miniwidget-list.component.html',
  styleUrls: ['./miniwidget-list.component.scss']
})
export class MiniWidgetListComponent implements OnInit {
  @ViewChildren('dynamic', { read: ViewContainerRef })
  private miniWidgetTargets: QueryList<ViewContainerRef> | undefined;

  public miniWidgetList: IMiniWidgetConfig[] = [];

  private ERROR_MESSAGE_GET_MINI_WIDGETS = 'Erreur lors de la récupération des mini widgets.';
  private ERROR_MESSAGE_ADD_MINI_WIDGET = "Erreur lors de l'ajout d'un mini widget.";

  constructor(
    private cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private miniWidgetService: MiniWidgetService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.miniWidgetService.getMiniWidgets().subscribe({
      next: (miniWidgets) => {
        this.miniWidgetList = miniWidgets;
        this.createMiniWidgets();
      },
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_MESSAGE_GET_MINI_WIDGETS)
    });
  }

  public openCreateMiniWidgetModal(): void {
    const dialogRef = this.dialog.open(CreateMiniWidgetModalComponent, {
      height: '400px',
      width: '600px'
    });

    dialogRef.afterClosed().subscribe((result: WidgetTypeEnum) => {
      if (result) {
        const type = WidgetTypeEnum[result];
        this.miniWidgetService.addMiniWidget(type).subscribe({
          next: (createdMiniWidgetResponse: IMiniWidgetConfig) => {
            this.miniWidgetList = [...this.miniWidgetList, createdMiniWidgetResponse];
            this.createMiniWidgets();
          },
          error: (error: HttpErrorResponse) =>
            this.errorHandlerService.handleError(error.message, this.ERROR_MESSAGE_ADD_MINI_WIDGET)
        });
      }
    });
  }

  private createMiniWidgets(): void {
    this.cdRef.detectChanges();
    if (this.miniWidgetTargets) {
      this.miniWidgetTargets.forEach((target, index) => {
        target.detach();
        let component;
        const injector: Injector = Injector.create({
          providers: [
            {
              provide: 'widgetId',
              useValue: this.miniWidgetList[index].id
            }
          ]
        });
        const widgetData = this.miniWidgetList[index].data;
        switch (this.miniWidgetList[index].type) {
          case WidgetTypeEnum.WEATHER: {
            component = target.createComponent(WeatherMiniWidgetComponent, {
              injector: injector
            });
            component.instance.city = widgetData ? (widgetData['city'] as string) : null;
            break;
          }
        }
      });
    }
  }
}
