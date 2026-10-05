import { ErrorHandlerService } from "../services/error.handler.service";
import { TabService } from "../services/tab.service/tab.service";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  output,
  signal
} from "@angular/core";
import { ITab } from "../model/Tab";
import { HttpErrorResponse } from "@angular/common/http";
import { MatIcon } from "@angular/material/icon";
import { FormField, form } from "@angular/forms/signals";

@Component({
  selector: "dash-tab",
  templateUrl: "./tab.component.html",
  styleUrls: ["./tab.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, FormField]
})
export class TabComponent {
  public readonly tab = input.required<ITab>();
  public readonly tabDeletedEvent = output<number>();
  public readonly editMode = signal(false);
  public readonly tabLabel = linkedSignal(() => this.tab().label);
  public readonly tabLabelForm = form(this.tabLabel);

  private readonly ERROR_MESSAGE_UPDATE_TAB = "Erreur lors de la modification d'un onglet.";
  private readonly tabService = inject(TabService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public deleteTabFromDash(): void {
    const tab = this.tab();
    if (tab) {
      this.tabDeletedEvent.emit(tab.id);
    }
  }

  public saveTabName(tabId: number, label: string, tabOrder: number): void {
    this.tabService.updateTab(tabId, label, tabOrder).subscribe({
      error: (error: HttpErrorResponse) =>
        this.errorHandlerService.handleError(error, this.ERROR_MESSAGE_UPDATE_TAB),
      complete: this.toggleEditMode.bind(this)
    });
  }

  public toggleEditMode(): void {
    this.editMode.set(!this.editMode());
  }

  public enterSaveTabName(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      const tab = this.tab();
      if (tab) {
        this.saveTabName(tab.id, this.tabLabel(), tab.tabOrder);
      }
    }
  }
}
