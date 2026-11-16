import { CdkDragDrop, CdkDropList } from "@angular/cdk/drag-drop";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { Tab } from "@features/tab/tab";
import { TabBar } from "./tab-bar";

describe("TabBar", () => {
  let fixture: ComponentFixture<TabBar>;

  const tabs: Tab[] = [
    { id: 1, label: "Flux RSS", tabOrder: 1 },
    { id: 2, label: "Météo", tabOrder: 2 }
  ];

  beforeEach(async () => {
    fixture = TestBed.createComponent(TabBar);
    fixture.componentRef.setInput("tabs", tabs);
    fixture.componentRef.setInput("activeTabId", 1);
    await fixture.whenStable();
  });

  function getElement<T extends HTMLElement>(selector: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(selector)!;
  }

  function getTabs(): HTMLElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("dash-tab-label"));
  }

  function drop(previousIndex: number, currentIndex: number): void {
    fixture.debugElement.query(By.css("#tab-list")).triggerEventHandler("cdkDropListDropped", {
      previousIndex,
      currentIndex
    } as CdkDragDrop<Tab[]>);
  }

  /** Renames the second tab with its label, as when its save button is clicked. */
  async function renameSecondTab(label: string): Promise<void> {
    getTabs()[1].querySelector(".tab-label")?.dispatchEvent(new MouseEvent("dblclick"));
    await fixture.whenStable();
    const input = getElement<HTMLInputElement>("#tab-name-input");
    input.value = label;
    input.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    getElement(".save-tab-button").click();
  }

  describe("Template", () => {
    it("Should display the tabs and the selected one", () => {
      expect(getTabs().map((tab) => tab.textContent?.trim())).toEqual(["Flux RSS", "Météo"]);
      expect(getTabs()[0].classList).toContain("selected-item");
      expect(getTabs()[1].classList).not.toContain("selected-item");
      expect(getTabs()[0].getAttribute("aria-current")).toEqual("page");
      expect(getTabs()[1].getAttribute("aria-current")).toBeNull();
      expect(getElement("#tab-list-container").getAttribute("aria-label")).toEqual("Onglets");
      expect(getElement("#add-new-tab-button").getAttribute("aria-label")).toEqual(
        "Ajouter un nouvel onglet"
      );
    });

    it("Should sort the tabs horizontally", () => {
      const dropList = fixture.debugElement.query(By.css("#tab-list")).injector.get(CdkDropList);
      expect(dropList.orientation).toEqual("horizontal");
    });

    it("Should only make the tabs draggable in edit mode", async () => {
      expect(getTabs()[0].classList).not.toContain("draggable");
      fixture.componentRef.setInput("editModeEnabled", true);
      await fixture.whenStable();
      expect(getTabs().every((tab) => tab.classList.contains("draggable"))).toBe(true);
    });

    it("Should select another tab", async () => {
      fixture.componentRef.setInput("activeTabId", 2);
      await fixture.whenStable();
      expect(getTabs()[0].classList).not.toContain("selected-item");
      expect(getTabs()[1].classList).toContain("selected-item");
    });
  });

  describe("Outputs", () => {
    it("Should ask to select a tab when it is clicked or when Enter is pressed", () => {
      const selectedTabIds: number[] = [];
      fixture.componentInstance.tabSelected.subscribe((tabId) => selectedTabIds.push(tabId));
      getTabs()[1].click();
      getTabs()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(selectedTabIds).toEqual([2, 1]);
    });

    it("Should ask to add a tab", () => {
      let newTabRequests = 0;
      fixture.componentInstance.newTabRequested.subscribe(() => newTabRequests++);
      getElement<HTMLButtonElement>("#add-new-tab-button").click();
      expect(newTabRequests).toEqual(1);
    });

    it("Should send the renamed tab, without selecting it", async () => {
      const renamedTabs: Tab[] = [];
      const selectedTabIds: number[] = [];
      fixture.componentInstance.tabRenamed.subscribe((tab) => renamedTabs.push(tab));
      fixture.componentInstance.tabSelected.subscribe((tabId) => selectedTabIds.push(tabId));
      await renameSecondTab("Journaux");
      expect(renamedTabs).toEqual([{ ...tabs[1], label: "Journaux" }]);
      expect(selectedTabIds).toEqual([]);
    });

    it("Should ask to delete a tab, without selecting it", async () => {
      const deletedTabIds: number[] = [];
      const selectedTabIds: number[] = [];
      fixture.componentInstance.tabDeleted.subscribe((tabId) => deletedTabIds.push(tabId));
      fixture.componentInstance.tabSelected.subscribe((tabId) => selectedTabIds.push(tabId));
      getTabs()[1].querySelector(".tab-label")?.dispatchEvent(new MouseEvent("dblclick"));
      await fixture.whenStable();
      getElement(".delete-tab-button").click();
      expect(deletedTabIds).toEqual([2]);
      expect(selectedTabIds).toEqual([]);
    });

    it("Should send the reordered tabs", () => {
      const reorderedTabs: Tab[][] = [];
      fixture.componentInstance.tabsReordered.subscribe((tabList) => reorderedTabs.push(tabList));
      drop(0, 1);
      expect(reorderedTabs).toEqual([
        [
          { ...tabs[1], tabOrder: 0 },
          { ...tabs[0], tabOrder: 1 }
        ]
      ]);
    });

    it("Should not reorder the tabs when a tab is dropped back at its place", () => {
      const reorderedTabs: Tab[][] = [];
      fixture.componentInstance.tabsReordered.subscribe((tabList) => reorderedTabs.push(tabList));
      drop(1, 1);
      expect(reorderedTabs).toEqual([]);
    });
  });
});
