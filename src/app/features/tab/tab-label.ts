import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, input, linkedSignal, output, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { MatIcon } from "@angular/material/icon";
import { Tab } from "@features/tab/tab";
import { requiredText } from "@shared/forms/form-validators";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { TabService } from "@features/tab/tab-service";

@Component({
  selector: "dash-tab-label",
  templateUrl: "./tab-label.html",
  styleUrl: "./tab-label.scss",
  imports: [MatIcon, FormField]
})
export class TabLabel {
  protected readonly labels = {
    tabName: "Tab name",
    saveName: "Enregistrer le nom",
    save: "Enregistrer",
    deleteTab: "Supprimer l'onglet"
  };

  public readonly tab = input.required<Tab>();
  public readonly tabDeletedEvent = output<number>();
  public readonly tabUpdatedEvent = output<Tab>();
  protected readonly editMode = signal(false);
  protected readonly tabLabel = linkedSignal(() => this.tab().label);
  protected readonly tabLabelForm = form(this.tabLabel, (path) => requiredText(path));

  private readonly ERROR_MESSAGE_UPDATE_TAB = "Erreur lors de la modification d'un onglet.";
  private readonly tabService = inject(TabService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  protected deleteTabFromDash(): void {
    this.tabDeletedEvent.emit(this.tab().id);
  }

  protected saveTabName(): void {
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

  protected toggleEditMode(): void {
    this.editMode.update((editMode) => !editMode);
  }
}
