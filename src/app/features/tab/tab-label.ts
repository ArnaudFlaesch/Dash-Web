import { Component, input, linkedSignal, output } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";
import { MatIcon } from "@angular/material/icon";
import { Tab } from "@features/tab/tab";
import { requiredText } from "@shared/forms/form-validators";

@Component({
  selector: "dash-tab-label",
  templateUrl: "./tab-label.html",
  styleUrl: "./tab-label.scss",
  imports: [MatIcon, FormField]
})
export class TabLabel {
  protected readonly labels = {
    tabName: "Nom de l'onglet",
    saveName: "Enregistrer le nom",
    save: "Enregistrer",
    deleteTab: "Supprimer l'onglet"
  };

  public readonly tab = input.required<Tab>();
  public readonly tabDeleted = output<number>();
  /** The new name of the tab, without its surrounding spaces. */
  public readonly tabRenamed = output<string>();

  // The edition is closed once the renamed tab is received, so it stays open when the renaming fails
  public readonly editMode = linkedSignal({ source: this.tab, computation: () => false });
  public readonly tabLabel = linkedSignal(() => this.tab().label);
  public readonly tabLabelForm = form(this.tabLabel, (path) => requiredText(path));

  public deleteTabFromDash(): void {
    this.tabDeleted.emit(this.tab().id);
  }

  public saveTabName(): void {
    if (this.tabLabelForm().invalid()) {
      return;
    }
    this.tabRenamed.emit(this.tabLabel().trim());
  }

  public toggleEditMode(): void {
    this.editMode.update((editMode) => !editMode);
  }
}
