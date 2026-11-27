import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, input, output } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { Tab } from "@features/tab/tab";
import { TabLabel } from "@features/tab/tab-label";

@Component({
  selector: "dash-tab-bar",
  templateUrl: "./tab-bar.html",
  styleUrl: "./tab-bar.scss",
  imports: [CdkDropList, CdkDrag, TabLabel, MatIconButton, MatIcon, MatTooltip]
})
export class TabBar {
  protected readonly labels = {
    tabs: "Onglets",
    doubleClickToRename: "Double-cliquez pour renommer",
    addNewTab: "Ajouter un nouvel onglet"
  };

  public readonly tabs = input.required<Tab[]>();
  public readonly activeTabId = input.required<number>();
  /** The tabs can only be reordered in edit mode. */
  public readonly editModeEnabled = input(false);

  public readonly tabSelected = output<number>();
  /** The tab with its new name, not saved yet. */
  public readonly tabRenamed = output<Tab>();
  public readonly tabDeleted = output<number>();
  /** All the tabs in their new order, with their updated tabOrder. */
  public readonly tabsReordered = output<Tab[]>();
  public readonly newTabRequested = output();

  public renameTab(tab: Tab, label: string): void {
    this.tabRenamed.emit({ ...tab, label });
  }

  public dropTab(event: CdkDragDrop<Tab[]>): void {
    // A tab dropped back at its place doesn't change the order
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const tabs = [...this.tabs()];
    moveItemInArray(tabs, event.previousIndex, event.currentIndex);
    this.tabsReordered.emit(tabs.map((tab, index) => ({ ...tab, tabOrder: index })));
  }
}
