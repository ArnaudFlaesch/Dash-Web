import { ErrorHandlerService } from "../services/error.handler.service";
import { TabService } from "../services/tab.service/tab.service";
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from "@angular/core";
import { ITab } from "../model/Tab";
import { HttpErrorResponse } from "@angular/common/http";
import { MatIcon } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "dash-tab",
  templateUrl: "./tab.component.html",
  styleUrls: ["./tab.component.scss"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIcon]
})
export class TabComponent {
  public readonly tab = input.required<ITab>();
  public readonly tabDeletedEvent = output<number>();
  public readonly editMode = signal(false);

  private readonly ERROR_MESSAGE_UPDATE_TAB = "Erreur lors de la modification d'un onglet.";
  private readonly tabService = inject(TabService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  public deleteTabFromDash(): void {
    if (this.tab()) {
      this.tabDeletedEvent.emit(this.tab().id);
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
        this.saveTabName(tab.id, tab.label, tab.tabOrder);
      }
    }
  }
}
