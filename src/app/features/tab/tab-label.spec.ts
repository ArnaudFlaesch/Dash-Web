import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { Tab } from "@features/tab/tab";
import { ErrorHandlerService } from "@core/error-handler/error-handler-service";
import { TabLabel } from "./tab-label";
import { provideHttpClient } from "@angular/common/http";
import { vi } from "vitest";

describe("TabLabel", () => {
  let fixture: ComponentFixture<TabLabel>;
  let httpTestingController: HttpTestingController;

  const tabData: Tab = {
    id: 1,
    label: "Flux RSS",
    tabOrder: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(TabLabel);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
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

  describe("Simple cases", () => {
    it("Should display and edit a tab", async () => {
      fixture.componentRef.setInput("tab", tabData);
      await fixture.whenStable();
      expect(getElement("#tab-name-input")).toBeNull();

      getElement(".tab-label").dispatchEvent(new MouseEvent("dblclick"));
      await fixture.whenStable();
      expect(getElement("#tab-name-input")).not.toBeNull();

      const updatedTabLabel = "Journaux";
      fixture.componentRef.setInput("tab", { ...tabData, label: updatedTabLabel });
      await fixture.whenStable();
      expect(getElement<HTMLInputElement>("#tab-name-input").value).toEqual(updatedTabLabel);

      getElement("#tab-name-input").dispatchEvent(new MouseEvent("dblclick"));
      const updatedTabData = {
        id: 1,
        label: updatedTabLabel,
        tabOrder: 1
      };
      const request = httpTestingController.expectOne(environment.backend_url + "/tabs/1");
      expect(request.request.method).toEqual("PUT");
      expect(request.request.body).toEqual({ label: updatedTabLabel, tabOrder: 1 });
      request.flush(updatedTabData);
      await fixture.whenStable();
      expect(getElement("#tab-name-input")).toBeNull();
      expect(getElement(".tab-label").textContent?.trim()).toEqual(updatedTabLabel);
    });

    it("Should not update a tab because of server error", async () => {
      await editTab();
      pressEnter(".save-tab-button");

      httpTestingController
        .expectOne(environment.backend_url + "/tabs/1")
        .error(new ProgressEvent("Server error"));
      await fixture.whenStable();
      expect(getElement("#tab-name-input")).not.toBeNull();
    });

    it("Should delete a tab when it exists", async () => {
      const deletedTabIds: number[] = [];
      fixture.componentInstance.tabDeletedEvent.subscribe((tabId) => deletedTabIds.push(tabId));
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

    it("Should save the new name of the tab when the save button is clicked", async () => {
      const updatedTabs: Tab[] = [];
      fixture.componentInstance.tabUpdatedEvent.subscribe((tab) => updatedTabs.push(tab));
      await editTab();
      await typeTabName("Journaux");
      getElement(".save-tab-button").click();

      const request = httpTestingController.expectOne(environment.backend_url + "/tabs/1");
      expect(request.request.body).toEqual({ label: "Journaux", tabOrder: 1 });
      request.flush({ ...tabData, label: "Journaux" });
      await fixture.whenStable();

      expect(updatedTabs).toEqual([{ ...tabData, label: "Journaux" }]);
      expect(getElement("#tab-name-input")).toBeNull();
      expect(getElement(".tab-label").textContent?.trim()).toEqual("Journaux");
    });

    it("Should save the new name of the tab when Enter is pressed", async () => {
      await editTab();
      await typeTabName("Journaux");
      pressEnter("#tab-name-input");
      httpTestingController
        .expectOne(environment.backend_url + "/tabs/1")
        .flush({ ...tabData, label: "Journaux" });
      await fixture.whenStable();
      expect(getElement("#tab-name-input")).toBeNull();
      expect(getElement(".tab-label").textContent?.trim()).toEqual("Journaux");
    });

    it("Should save the name without its surrounding spaces", async () => {
      await editTab();
      await typeTabName("  Journaux ");
      getElement(".save-tab-button").click();
      const request = httpTestingController.expectOne(environment.backend_url + "/tabs/1");
      expect(request.request.body).toEqual({ label: "Journaux", tabOrder: 1 });
      request.flush({ ...tabData, label: "Journaux" });
    });

    it("Should save the name and delete the tab with the Space key", async () => {
      const deletedTabIds: number[] = [];
      fixture.componentInstance.tabDeletedEvent.subscribe((tabId) => deletedTabIds.push(tabId));
      await editTab();
      getElement(".delete-tab-button").dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
      expect(deletedTabIds).toEqual([tabData.id]);

      getElement(".save-tab-button").dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
      httpTestingController.expectOne(environment.backend_url + "/tabs/1").flush({ ...tabData });
      await fixture.whenStable();
    });

    it("Should not save a blank name", async () => {
      await editTab();
      await typeTabName("   ");
      getElement(".save-tab-button").click();
      httpTestingController.expectNone(environment.backend_url + "/tabs/1");
      await fixture.whenStable();
      expect(getElement("#tab-name-input")).not.toBeNull();
    });

    it("Should display an error when the tab cannot be renamed", async () => {
      const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
      await editTab();
      getElement(".save-tab-button").click();
      httpTestingController
        .expectOne(environment.backend_url + "/tabs/1")
        .flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();
      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 500 }),
        "Erreur lors de la modification d'un onglet."
      );
      expect(getElement("#tab-name-input")).not.toBeNull();
    });

    it("Should ask to delete the tab when the delete button is clicked", async () => {
      const deletedTabIds: number[] = [];
      fixture.componentInstance.tabDeletedEvent.subscribe((tabId) => deletedTabIds.push(tabId));
      await editTab();
      getElement(".delete-tab-button").click();
      expect(deletedTabIds).toEqual([tabData.id]);
    });
  });
});
