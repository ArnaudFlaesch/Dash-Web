import { ErrorHandlerService } from './../services/error.handler.service';
import { TabService } from './../services/tab.service/tab.service';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ITab } from '../model/Tab';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss']
})
export class TabComponent {
  public editMode = false;

  @Input()
  public tab: ITab | undefined;
  @Output() tabDeletedEvent = new EventEmitter<number>();

  private ERROR_MESSAGE_UPDATE_TAB = "Erreur lors de la modification d'un onglet.";
  private ERROR_MESSAGE_DELETE_TAB = "Erreur lors de la suppression d'un onglet.";

  constructor(private tabService: TabService, private errorHandlerService: ErrorHandlerService) {}

  public deleteTabFromDash() {
    if (this.tab) {
      this.tabService.deleteTab(this.tab.id).subscribe({
        error: (error: Error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_MESSAGE_DELETE_TAB),
        complete: () => this.tabDeletedEvent.emit(this.tab?.id)
      });
    }
  }

  public saveTabName(tabId: number, label: string, tabOrder: number) {
    this.tabService.updateTab(tabId, label, tabOrder).subscribe({
      error: (error: Error) =>
        this.errorHandlerService.handleError(error.message, this.ERROR_MESSAGE_UPDATE_TAB),
      complete: this.toggleEditMode.bind(this)
    });
  }

  public toggleEditMode() {
    this.editMode = !this.editMode;
  }

  public enterSaveTabName(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.tab) {
        this.saveTabName(this.tab.id, this.tab.label, this.tab.tabOrder);
      }
    }
  }
}
