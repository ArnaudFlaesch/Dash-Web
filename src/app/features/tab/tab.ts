import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, input, linkedSignal, output, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { MatIcon } from "@angular/material/icon";
import { ITab } from "@features/tab/tab.model";
import { requiredText } from "@shared/utils/form-validators";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { TabService } from "@features/tab/tab-service";

@Component({
  selector: "dash-tab",
  templateUrl: "./tab.html",
  styleUrl: "./tab.scss",
  imports: [MatIcon, FormField]
})
export class Tab {
  public readonly labels = {
    tabName: "Tab name",
    saveName: "Enregistrer le nom",
    save: "Enregistrer",
    deleteTab: "Supprimer l'onglet"
  };

  public readonly tab = input.required<ITab>();
  public readonly tabDeletedEvent = output<number>();
  public readonly tabUpdatedEvent = output<ITab>();
  public readonly editMode = signal(false);
  public readonly tabLabel = linkedSignal(() => this.tab().label);
  public readonly tabLabelForm = form(this.tabLabel, (path) => requiredText(path));

  private readonly ERROR_MESSAGE_UPDATE_TAB = "Erreur lors de la modification d'un onglet.";
  private readonly tabService = inject(TabService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public deleteTabFromDash(): void {
    this.tabDeletedEvent.emit(this.tab().id);
  }

  public saveTabName(): void {
    if (this.tabLabelForm().invalid()) {
      return;
    }
    const { id, tabOrder } = this.tab();
    this.tabService.updateTab(id, this.tabLabel(), tabOrder).subscribe({
      next: (updatedTab) => this.tabUpdatedEvent.emit(updatedTab),
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_UPDATE_TAB),
      complete: () => this.toggleEditMode()
    });
  }

  public toggleEditMode(): void {
    this.editMode.update((editMode) => !editMode);
  }
}
