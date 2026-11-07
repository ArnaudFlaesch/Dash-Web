import { NgComponentOutlet } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, Injector, Type } from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatIconButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { catchError, filter, of, switchMap } from "rxjs";
import { MiniWidgetType } from "@widgets/mini-widget-type";
import { WidgetTypePickerModal } from "@widgets/widget-type-picker-modal/widget-type-picker-modal";
import { MiniWidgetConfig } from "@widgets/mini-widget-config";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { MiniWidgetService } from "@widgets/mini-widget-service";
import { WeatherMiniWidget } from "@widgets/weather-widget/weather-mini-widget/weather-mini-widget";
import { cachedWidgetInjectors } from "@widgets/widget-tokens";
import { WidgetTypePickerData } from "@widgets/widget-type-picker-modal/widget-type-picker-data";
import { MINI_WIDGET_TYPE_OPTIONS } from "@widgets/widget-type-picker-modal/widget-type-options";

@Component({
  selector: "dash-mini-widget-list",
  templateUrl: "./mini-widget-list.html",
  styleUrl: "./mini-widget-list.scss",
  imports: [MatIconButton, MatTooltip, MatIcon, NgComponentOutlet]
})
export class MiniWidgetList {
  private readonly MINI_WIDGET_COMPONENTS: Record<MiniWidgetType, Type<unknown>> = {
    [MiniWidgetType.WEATHER]: WeatherMiniWidget
  };

  protected readonly labels = {
    addNewMiniWidget: "Ajouter un nouveau mini widget"
  };

  private readonly ERROR_MESSAGES = {
    getMiniWidgets: "Erreur lors de la récupération des mini widgets.",
    addMiniWidget: "Erreur lors de l'ajout d'un mini widget.",
    deleteMiniWidget: "Erreur lors de la suppression du mini widget."
  };

  private readonly miniWidgetsResource = rxResource({
    stream: () =>
      this.miniWidgetService.getMiniWidgets().pipe(
        catchError((error: HttpErrorResponse) => {
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.getMiniWidgets);
          return of([]);
        })
      ),
    defaultValue: [] as MiniWidgetConfig[]
  });

  public readonly miniWidgetList = this.miniWidgetsResource.value;

  public readonly miniWidgetComponents = this.MINI_WIDGET_COMPONENTS;
  /** Injector providing the mini widget id and configuration, cached so the mini widget is not recreated. */
  public readonly getMiniWidgetInjector = cachedWidgetInjectors(inject(Injector));

  private readonly dialog = inject(MatDialog);
  private readonly miniWidgetService = inject(MiniWidgetService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public constructor() {
    this.miniWidgetService.miniWidgetDeleted
      .pipe(takeUntilDestroyed())
      .subscribe((miniWidgetId) => this.deleteMiniWidget(miniWidgetId));
  }

  public openCreateMiniWidgetModal(): void {
    this.dialog
      .open<WidgetTypePickerModal, WidgetTypePickerData, keyof typeof MiniWidgetType>(
        WidgetTypePickerModal,
        {
          width: "640px",
          data: {
            title: "Ajouter un mini widget",
            widgetTypes: MINI_WIDGET_TYPE_OPTIONS
          }
        }
      )
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((type) => this.miniWidgetService.addMiniWidget(MiniWidgetType[type]))
      )
      .subscribe({
        next: (createdMiniWidget) =>
          this.miniWidgetList.update((miniWidgetList) => [...miniWidgetList, createdMiniWidget]),
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.addMiniWidget)
      });
  }

  private deleteMiniWidget(miniWidgetId: number): void {
    this.miniWidgetService.deleteMiniWidget(miniWidgetId).subscribe({
      next: () =>
        this.miniWidgetList.update((miniWidgetList) =>
          miniWidgetList.filter((miniWidget) => miniWidget.id !== miniWidgetId)
        ),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGES.deleteMiniWidget)
    });
  }
}
