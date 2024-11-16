import { ErrorHandlerService } from "./../services/error.handler.service";
import { TabService } from "./../services/tab.service/tab.service";
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject
} from "@angular/core";
import { ITab } from "../model/Tab";
import { HttpErrorResponse } from "@angular/common/http";
import { MatIcon } from "@angular/material/icon";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "dash-tab",
  templateUrl: "./tab.component.html",
  styleUrls: ["./tab.component.scss"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [FormsModule, MatIcon]
})
export class TabComponent {
  private readonly tabService = inject(TabService);
  errorHandlerService = inject(ErrorHandlerService);

  @Input()
  public tab: ITab | undefined;
  @Output() tabDeletedEvent = new EventEmitter<number>();

  public editMode = false;

  private readonly ERROR_MESSAGE_UPDATE_TAB = "Erreur lors de la modification d'un onglet.";

  public deleteTabFromDash(): void {
    if (this.tab) {
      this.tabDeletedEvent.emit(this.tab.id);
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
    this.editMode = !this.editMode;
  }

  public enterSaveTabName(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      if (this.tab) {
        this.saveTabName(this.tab.id, this.tab.label, this.tab.tabOrder);
      }
    }
  }
}
