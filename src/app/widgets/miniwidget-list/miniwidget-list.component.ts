import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  ViewContainerRef,
  inject,
  viewChildren
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";

import { Subject, takeUntil } from "rxjs";
import { MiniWidgetTypeEnum } from "../../enums/MiniWidgetTypeEnum";
import { CreateMiniWidgetModalComponent } from "../../modals/create-mini-widget-modal/create-mini-widget-modal.component";
import { IMiniWidgetConfig } from "../../model/IMiniWidgetConfig";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { MiniWidgetService } from "../../services/widget.service/miniwidget.service";
import { WeatherMiniWidgetComponent } from "../weather-widget/weather-mini-widget/weather-miniwidget.component";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { MatMiniFabButton } from "@angular/material/button";

@Component({
  selector: "dash-miniwidget-list",
  templateUrl: "./miniwidget-list.component.html",
  styleUrls: ["./miniwidget-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.Default,
  standalone: true,
  imports: [MatMiniFabButton, MatTooltip, MatIcon]
})
export class MiniWidgetListComponent implements OnInit, OnDestroy {
  private readonly cdRef = inject(ChangeDetectorRef);
  dialog = inject(MatDialog);
  private readonly miniWidgetService = inject(MiniWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  readonly miniWidgetTargets = viewChildren("dynamic", { read: ViewContainerRef });

  public miniWidgetList: IMiniWidgetConfig[] = [];
  private readonly destroy$: Subject<unknown> = new Subject();

  private readonly ERROR_MESSAGE_GET_MINI_WIDGETS =
    "Erreur lors de la récupération des mini widgets.";
  private readonly ERROR_MESSAGE_ADD_MINI_WIDGET = "Erreur lors de l'ajout d'un mini widget.";
  private readonly ERROR_MESSAGE_DELETE_MINI_WIDGET =
    "Erreur lors de la suppression du mini widget.";

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
      height: "400px",
      width: "600px"
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
    const miniWidgetTargets = this.miniWidgetTargets();
    if (miniWidgetTargets) {
      miniWidgetTargets.forEach((target, index) => {
        target.detach();
        let component;
        const injector: Injector = Injector.create({
          providers: [
            {
              provide: "widgetId",
              useValue: this.miniWidgetList[index].id
            }
          ]
        });
        const widgetData = this.miniWidgetList[index].data;
        if (this.miniWidgetList[index].type === MiniWidgetTypeEnum.WEATHER) {
          component = target.createComponent(WeatherMiniWidgetComponent, {
            injector: injector
          });
          component.instance.city = widgetData?.["city"] as string;
        }
      });
    }
  }
}
