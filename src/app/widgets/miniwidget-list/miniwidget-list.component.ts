import { NgComponentOutlet } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, Injector, Type } from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatMiniFabButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { catchError, filter, of, switchMap } from "rxjs";
import { MiniWidgetTypeEnum } from "../../enums/MiniWidgetTypeEnum";
import { CreateMiniWidgetModalComponent } from "../../modals/create-mini-widget-modal/create-mini-widget-modal.component";
import { IMiniWidgetConfig } from "../../model/IMiniWidgetConfig";
import { ErrorHandlerService } from "../../services/error.handler.service";
import { MiniWidgetService } from "../../services/widget.service/miniwidget.service";
import { WeatherMiniWidgetComponent } from "../weather-widget/weather-mini-widget/weather-miniwidget.component";
import { WIDGET_DATA, WIDGET_ID } from "../widget.tokens";

const MINI_WIDGET_COMPONENTS: Record<MiniWidgetTypeEnum, Type<unknown>> = {
  [MiniWidgetTypeEnum.WEATHER]: WeatherMiniWidgetComponent
};

@Component({
  selector: "dash-miniwidget-list",
  templateUrl: "./miniwidget-list.component.html",
  styleUrl: "./miniwidget-list.component.scss",
  imports: [MatMiniFabButton, MatTooltip, MatIcon, NgComponentOutlet]
})
export class MiniWidgetListComponent {
  public readonly miniWidgetsResource = rxResource({
    stream: () =>
      this.miniWidgetService.getMiniWidgets().pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_GET_MINI_WIDGETS);
          return of([]);
        })
      ),
    defaultValue: [] as IMiniWidgetConfig[]
  });

  public readonly miniWidgetList = this.miniWidgetsResource.value;
  public readonly miniWidgetComponents = MINI_WIDGET_COMPONENTS;

  private readonly injector = inject(Injector);
  private readonly miniWidgetInjectors = new WeakMap<IMiniWidgetConfig, Injector>();
  private readonly dialog = inject(MatDialog);
  private readonly miniWidgetService = inject(MiniWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly ERROR_MESSAGE_GET_MINI_WIDGETS =
    "Erreur lors de la récupération des mini widgets.";
  private readonly ERROR_MESSAGE_ADD_MINI_WIDGET = "Erreur lors de l'ajout d'un mini widget.";
  private readonly ERROR_MESSAGE_DELETE_MINI_WIDGET =
    "Erreur lors de la suppression du mini widget.";

  public constructor() {
    this.miniWidgetService.miniWidgetDeleted
      .pipe(takeUntilDestroyed())
      .subscribe((miniWidgetId) => this.deleteMiniWidget(miniWidgetId));
  }

  public openCreateMiniWidgetModal(): void {
    this.dialog
      .open(CreateMiniWidgetModalComponent, { height: "400px", width: "600px" })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((type: keyof typeof MiniWidgetTypeEnum) =>
          this.miniWidgetService.addMiniWidget(MiniWidgetTypeEnum[type])
        )
      )
      .subscribe({
        next: (createdMiniWidget) =>
          this.miniWidgetList.update((miniWidgetList) => [...miniWidgetList, createdMiniWidget]),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_ADD_MINI_WIDGET)
      });
  }

  /** Injector providing the mini widget id and configuration, cached so the mini widget is not recreated. */
  public getMiniWidgetInjector(miniWidget: IMiniWidgetConfig): Injector {
    let miniWidgetInjector = this.miniWidgetInjectors.get(miniWidget);
    if (!miniWidgetInjector) {
      miniWidgetInjector = Injector.create({
        providers: [
          { provide: WIDGET_ID, useValue: miniWidget.id },
          { provide: WIDGET_DATA, useValue: miniWidget.data ?? {} }
        ],
        parent: this.injector
      });
      this.miniWidgetInjectors.set(miniWidget, miniWidgetInjector);
    }
    return miniWidgetInjector;
  }

  private deleteMiniWidget(miniWidgetId: number): void {
    this.miniWidgetService.deleteMiniWidget(miniWidgetId).subscribe({
      next: () =>
        this.miniWidgetList.update((miniWidgetList) =>
          miniWidgetList.filter((miniWidget) => miniWidget.id !== miniWidgetId)
        ),
      error: (error) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_DELETE_MINI_WIDGET)
    });
  }
}
