import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  ViewContainerRef
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Subject, takeUntil } from 'rxjs';
import { MiniWidgetTypeEnum } from '../../enums/MiniWidgetTypeEnum';
import { CreateMiniWidgetModalComponent } from '../../modals/create-mini-widget-modal/create-mini-widget-modal.component';
import { IMiniWidgetConfig } from '../../model/IMiniWidgetConfig';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { MiniWidgetService } from '../../services/widget.service/miniwidget.service';
import { WeatherMiniWidgetComponent } from '../weather-widget/weather-mini-widget/weather-miniwidget.component';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMiniFabButton } from '@angular/material/button';
import { NgFor } from '@angular/common';

@Component({
  selector: 'dash-miniwidget-list',
  templateUrl: './miniwidget-list.component.html',
  styleUrls: ['./miniwidget-list.component.scss'],
  standalone: true,
  imports: [NgFor, MatMiniFabButton, MatTooltip, MatIcon]
})
export class MiniWidgetListComponent implements OnInit, OnDestroy {
  @ViewChildren('dynamic', { read: ViewContainerRef })
  private miniWidgetTargets: QueryList<ViewContainerRef> | undefined;

  public miniWidgetList: IMiniWidgetConfig[] = [];
  private destroy$: Subject<unknown> = new Subject();

  private ERROR_MESSAGE_GET_MINI_WIDGETS = 'Erreur lors de la récupération des mini widgets.';
  private ERROR_MESSAGE_ADD_MINI_WIDGET = "Erreur lors de l'ajout d'un mini widget.";
  private ERROR_MESSAGE_DELETE_MINI_WIDGET = 'Erreur lors de la suppression du mini widget.';

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
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_GET_MINI_WIDGETS)
    });

    this.miniWidgetService.miniWidgetDeleted.pipe(takeUntil(this.destroy$)).subscribe({
      next: (miniWidgetId) => {
        this.miniWidgetService.deleteMiniWidget(miniWidgetId).subscribe({
          next: () =>
            (this.miniWidgetList = this.miniWidgetList.filter(
              (miniWidget) => miniWidget.id !== miniWidgetId
            )),
          error: (error) =>
            this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_DELETE_MINI_WIDGET)
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  public openCreateMiniWidgetModal(): void {
    const dialogRef = this.dialog.open(CreateMiniWidgetModalComponent, {
      height: '400px',
      width: '600px'
    });

    dialogRef.afterClosed().subscribe((result: MiniWidgetTypeEnum) => {
      if (result) {
        const type = MiniWidgetTypeEnum[result];
        this.miniWidgetService.addMiniWidget(type).subscribe({
          next: (createdMiniWidgetResponse: IMiniWidgetConfig) => {
            this.miniWidgetList = [...this.miniWidgetList, createdMiniWidgetResponse];
            this.createMiniWidgets();
          },
          error: (error: HttpErrorResponse) =>
            this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_ADD_MINI_WIDGET)
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
          case MiniWidgetTypeEnum.WEATHER: {
            component = target.createComponent(WeatherMiniWidgetComponent, {
              injector: injector
            });
            component.instance.city = widgetData?.['city'] as string;
            break;
          }
        }
      });
    }
  }
}
