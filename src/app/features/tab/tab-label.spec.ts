import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Tab } from "@features/tab/tab";
import { TabLabel } from "./tab-label";

describe("TabLabel", () => {
  let fixture: ComponentFixture<TabLabel>;
  let renamedLabels: string[];
  let deletedTabIds: number[];

  const tabData: Tab = {
    id: 1,
    label: "Flux RSS",
    tabOrder: 1
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(TabLabel);
    renamedLabels = [];
    deletedTabIds = [];
    fixture.componentInstance.tabRenamed.subscribe((label) => renamedLabels.push(label));
    fixture.componentInstance.tabDeleted.subscribe((tabId) => deletedTabIds.push(tabId));
  });

  function getElement<T extends HTMLElement>(selector: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(selector)!;
  }

  /** Displays the tab, then double-clicks on its label to edit it. */
  async function editTab(): Promise<void> {
    fixture.componentRef.setInput("tab", tabData);
    await fixture.whenStable();
    getElement(".tab-label").dispatchEvent(new MouseEvent("dblclick"));
    await fixture.whenStable();
  }

  async function typeTabName(name: string): Promise<void> {
    const input = getElement<HTMLInputElement>("#tab-name-input");
    input.value = name;
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
  }

  function pressEnter(selector: string): void {
    getElement(selector).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  }

  /** Sets the tab sent back by the parent once it is renamed. */
  async function receiveRenamedTab(label: string): Promise<void> {
    fixture.componentRef.setInput("tab", { ...tabData, label });
    await fixture.whenStable();
  }

  describe("Simple cases", () => {
    it("Should display and edit a tab", async () => {
      fixture.componentRef.setInput("tab", tabData);
      await fixture.whenStable();
      expect(getElement("#tab-name-input")).toBeNull();

      getElement(".tab-label").dispatchEvent(new MouseEvent("dblclick"));
      await fixture.whenStable();
      expect(getElement("#tab-name-input")).not.toBeNull();

      await typeTabName("Journaux");
      getElement("#tab-name-input").dispatchEvent(new MouseEvent("dblclick"));
      await fixture.whenStable();
      expect(renamedLabels).toEqual(["Journaux"]);
      // The edition stays open until the renamed tab is received
      expect(getElement("#tab-name-input")).not.toBeNull();

      await receiveRenamedTab("Journaux");
      expect(getElement("#tab-name-input")).toBeNull();
      expect(getElement(".tab-label").textContent?.trim()).toEqual("Journaux");
    });

    it("Should keep the edition open when the renamed tab is not received", async () => {
      await editTab();
      pressEnter(".save-tab-button");
      await fixture.whenStable();
      expect(renamedLabels).toEqual([tabData.label]);
      expect(getElement("#tab-name-input")).not.toBeNull();
    });

    it("Should delete a tab when it exists", async () => {
      await editTab();
      pressEnter(".delete-tab-button");
      expect(deletedTabIds).toEqual([tabData.id]);
    });
  });

  describe("Template", () => {
    it("Should display the label of the tab", async () => {
      fixture.componentRef.setInput("tab", tabData);
      await fixture.whenStable();
      expect(getElement(".tab-label").textContent?.trim()).toEqual(tabData.label);
      expect(getElement("#tab-name-input")).toBeNull();
    });

    it("Should display the edition form when the label is double-clicked", async () => {
      await editTab();
      expect(getElement(".tab-label")).toBeNull();
      expect(getElement<HTMLInputElement>("#tab-name-input").value).toEqual(tabData.label);
      expect(getElement("#tab-name-input").getAttribute("aria-label")).toEqual("Nom de l'onglet");
      const saveButton = getElement(".save-tab-button");
      expect(saveButton.getAttribute("aria-label")).toEqual("Enregistrer le nom");
      expect(saveButton.getAttribute("title")).toEqual("Enregistrer");
      expect(getElement(".delete-tab-button").getAttribute("title")).toEqual("Supprimer l'onglet");
    });

    it("Should send the new name of the tab when the save button is clicked", async () => {
      await editTab();
      await typeTabName("Journaux");
      getElement(".save-tab-button").click();
      expect(renamedLabels).toEqual(["Journaux"]);

      await receiveRenamedTab("Journaux");
      expect(getElement("#tab-name-input")).toBeNull();
      expect(getElement(".tab-label").textContent?.trim()).toEqual("Journaux");
    });

    it("Should send the new name of the tab when Enter is pressed", async () => {
      await editTab();
      await typeTabName("Journaux");
      pressEnter("#tab-name-input");
      expect(renamedLabels).toEqual(["Journaux"]);

      await receiveRenamedTab("Journaux");
      expect(getElement("#tab-name-input")).toBeNull();
      expect(getElement(".tab-label").textContent?.trim()).toEqual("Journaux");
    });

    it("Should send the name without its surrounding spaces", async () => {
      await editTab();
      await typeTabName("  Journaux ");
      getElement(".save-tab-button").click();
      expect(renamedLabels).toEqual(["Journaux"]);
    });

    it("Should save the name and delete the tab with the Space key", async () => {
      await editTab();
      getElement(".delete-tab-button").dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
      expect(deletedTabIds).toEqual([tabData.id]);

      getElement(".save-tab-button").dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
      expect(renamedLabels).toEqual([tabData.label]);
    });

    it("Should not save a blank name", async () => {
      await editTab();
      await typeTabName("   ");
      getElement(".save-tab-button").click();
      await fixture.whenStable();
      expect(renamedLabels).toEqual([]);
      expect(getElement("#tab-name-input")).not.toBeNull();
    });

    it("Should close the edition when the tab is received again, even with the same name", async () => {
      await editTab();
      getElement(".save-tab-button").click();
      await receiveRenamedTab(tabData.label);
      expect(getElement("#tab-name-input")).toBeNull();
      expect(getElement(".tab-label").textContent?.trim()).toEqual(tabData.label);
    });

    it("Should ask to delete the tab when the delete button is clicked", async () => {
      await editTab();
      getElement(".delete-tab-button").click();
      expect(deletedTabIds).toEqual([tabData.id]);
    });
  });
});
