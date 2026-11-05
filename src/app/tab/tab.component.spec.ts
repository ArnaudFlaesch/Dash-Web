import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { TabService } from "@services/tab.service";
import { ITab } from "@model/ITab";
import { ErrorHandlerService } from "@services/error-handler.service";
import { TabComponent } from "./tab.component";
import { provideHttpClient } from "@angular/common/http";
import { vi } from "vitest";

describe("TabComponent", () => {
  let component: TabComponent;
  let fixture: ComponentFixture<TabComponent>;
  let httpTestingController: HttpTestingController;

  const tabData: ITab = {
    id: 1,
    label: "Flux RSS",
    tabOrder: 1
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [ErrorHandlerService, provideHttpClient(), provideHttpClientTesting(), TabService]
    }).compileComponents();

    fixture = TestBed.createComponent(TabComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe("Simple cases", () => {
    it("Should display and edit a tab", () => {
      expect(component.editMode()).toEqual(false);
      fixture.componentRef.setInput("tab", tabData);
      component.toggleEditMode();
      expect(component.editMode()).toEqual(true);
      const updatedTabLabel = "Journaux";
      fixture.componentRef.setInput("tab", { ...component.tab(), label: updatedTabLabel });

      component.saveTabName();
      const updatedTabData = {
        id: 1,
        label: updatedTabLabel,
        tabOrder: 1
      };
      const request = httpTestingController.expectOne(environment.backend_url + "/tab/updateTab");
      request.flush(updatedTabData);
      expect(component.editMode()).toEqual(false);
    });

    it("Should not update a tab because of server error", () => {
      fixture.componentRef.setInput("tab", tabData);
      expect(component.editMode()).toEqual(false);
      component.toggleEditMode();
      expect(component.editMode()).toEqual(true);
      component.saveTabName();

      httpTestingController
        .expectOne(environment.backend_url + "/tab/updateTab")
        .error(new ProgressEvent("Server error"));
      expect(component.editMode()).toEqual(true);
    });

    it("Should delete a tab when it exists", () => {
      const deletedEventSpy = vi.spyOn(component.tabDeletedEvent, "emit");
      expect(deletedEventSpy).toHaveBeenCalledTimes(0);
      fixture.componentRef.setInput("tab", {
        id: 1,
        label: "Nouvel onglet",
        tabOrder: 1
      } as ITab);
      component.deleteTabFromDash();
      expect(deletedEventSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Template", () => {
    function getElement<T extends HTMLElement>(selector: string): T {
      return (fixture.nativeElement as HTMLElement).querySelector(selector) as T;
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
      expect(getElement("#tab-name-input").getAttribute("aria-label")).toEqual(
        component.labels.tabName
      );
      const saveButton = getElement(".save-tab-button");
      expect(saveButton.getAttribute("aria-label")).toEqual(component.labels.saveName);
      expect(saveButton.getAttribute("title")).toEqual(component.labels.save);
      expect(getElement(".delete-tab-button").getAttribute("title")).toEqual(
        component.labels.deleteTab
      );
    });

    it("Should save the new name of the tab when the save button is clicked", async () => {
      const updatedEventSpy = vi.spyOn(component.tabUpdatedEvent, "emit");
      await editTab();
      await typeTabName("Journaux");
      getElement(".save-tab-button").click();

      const request = httpTestingController.expectOne(environment.backend_url + "/tab/updateTab");
      expect(request.request.body).toEqual({ id: 1, label: "Journaux", tabOrder: 1 });
      request.flush({ ...tabData, label: "Journaux" });
      await fixture.whenStable();

      expect(updatedEventSpy).toHaveBeenCalledWith({ ...tabData, label: "Journaux" });
      expect(getElement("#tab-name-input")).toBeNull();
      expect(getElement(".tab-label").textContent?.trim()).toEqual("Journaux");
    });

    it("Should save the new name of the tab when Enter is pressed", async () => {
      await editTab();
      await typeTabName("Journaux");
      getElement("#tab-name-input").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      httpTestingController
        .expectOne(environment.backend_url + "/tab/updateTab")
        .flush({ ...tabData, label: "Journaux" });
      expect(component.editMode()).toBe(false);
    });

    it("Should not save a blank name", async () => {
      await editTab();
      await typeTabName("   ");
      getElement(".save-tab-button").click();
      httpTestingController.expectNone(environment.backend_url + "/tab/updateTab");
      expect(component.editMode()).toBe(true);
    });

    it("Should display an error when the tab cannot be renamed", async () => {
      const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
      await editTab();
      getElement(".save-tab-button").click();
      httpTestingController
        .expectOne(environment.backend_url + "/tab/updateTab")
        .flush(null, { status: 500, statusText: "Server error" });
      await fixture.whenStable();
      expect(handleErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: 500 }),
        "Erreur lors de la modification d'un onglet."
      );
      expect(getElement("#tab-name-input")).not.toBeNull();
    });

    it("Should ask to delete the tab when the delete button is clicked", async () => {
      const deletedEventSpy = vi.spyOn(component.tabDeletedEvent, "emit");
      await editTab();
      getElement(".delete-tab-button").click();
      expect(deletedEventSpy).toHaveBeenCalledWith(tabData.id);
    });
  });
});
