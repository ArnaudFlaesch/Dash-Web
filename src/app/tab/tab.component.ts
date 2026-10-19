import { HttpErrorResponse } from "@angular/common/http";
import { Component, inject, input, linkedSignal, output, signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { MatIcon } from "@angular/material/icon";
import { ITab } from "../model/Tab";
import { requiredText } from "../utils/form-validators";
import { ErrorHandlerService } from "../services/error.handler.service";
import { TabService } from "../services/tab.service/tab.service";

@Component({
  selector: "dash-tab",
  templateUrl: "./tab.component.html",
  styleUrl: "./tab.component.scss",
  imports: [MatIcon, FormField]
})
export class TabComponent {
  public readonly tab = input.required<ITab>();
  public readonly tabDeletedEvent = output<number>();
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
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_UPDATE_TAB),
      complete: () => this.toggleEditMode()
    });
  }

  public toggleEditMode(): void {
    this.editMode.update((editMode) => !editMode);
  }

  public enterSaveTabName(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.saveTabName();
    }
  }
}
