import { ErrorHandlerService } from './../services/error.handler.service';
import { TabService } from './../services/tab.service/tab.service';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ITab } from '../model/Tab';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'dash-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss']
})
export class TabComponent {
  @Input()
  public tab: ITab | undefined;
  @Output() tabDeletedEvent = new EventEmitter<number>();

  public editMode = false;

  private ERROR_MESSAGE_UPDATE_TAB = "Erreur lors de la modification d'un onglet.";

  constructor(
    private tabService: TabService,
    private errorHandlerService: ErrorHandlerService
  ) {}

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
    if (event.key === 'Enter') {
      if (this.tab) {
        this.saveTabName(this.tab.id, this.tab.label, this.tab.tabOrder);
      }
    }
  }
}
