import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatSlideToggleHarness } from "@angular/material/slide-toggle/testing";
import { HomeActionBar } from "./home-action-bar";

describe("HomeActionBar", () => {
  let fixture: ComponentFixture<HomeActionBar>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(HomeActionBar);
    fixture.componentRef.setInput("canAddWidget", true);
    await fixture.whenStable();
  });

  afterEach(() => {
    // The menus are rendered in an overlay attached to the body
    document.querySelector(".cdk-overlay-container")?.replaceChildren();
  });

  function getElement<T extends HTMLElement>(selector: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector<T>(selector)!;
  }

  /** Opens the user menu, rendered in an overlay. */
  async function openUserMenu(): Promise<void> {
    getElement<HTMLButtonElement>("#dash-menu").click();
    await fixture.whenStable();
  }

  /** Number of times the output emits while the action is done. */
  function countEmissions(
    outputName: keyof Pick<
      HomeActionBar,
      | "newWidgetRequested"
      | "editModeToggled"
      | "refreshRequested"
      | "configDownloadRequested"
      | "configImportRequested"
      | "logoutRequested"
    >,
    action: () => void
  ): number {
    let emissions = 0;
    fixture.componentInstance[outputName].subscribe(() => emissions++);
    action();
    return emissions;
  }

  describe("Template", () => {
    it("Should display the add widget button, enabled when a widget can be added", async () => {
      expect(getElement("#add-widget-button-label").textContent?.trim()).toEqual("Widget");
      expect(getElement<HTMLButtonElement>("#open-add-widget-modal").disabled).toBe(false);

      fixture.componentRef.setInput("canAddWidget", false);
      await fixture.whenStable();
      expect(getElement<HTMLButtonElement>("#open-add-widget-modal").disabled).toBe(true);
    });

    it("Should display the button of the edit mode", async () => {
      expect(getElement("#validate-widget-list-button")).toBeNull();
      expect(getElement("#toggle-edit-mode-button").getAttribute("aria-label")).toEqual(
        "Changer l'ordre des widgets"
      );

      fixture.componentRef.setInput("editModeEnabled", true);
      await fixture.whenStable();
      expect(getElement("#toggle-edit-mode-button")).toBeNull();
      expect(getElement("#validate-widget-list-button").getAttribute("aria-label")).toEqual(
        "Valider l'ordre des widgets"
      );
    });

    it("Should display the user menu", async () => {
      await openUserMenu();
      expect(document.querySelector("#logout-button")?.textContent).toContain("Déconnexion");
      expect(document.querySelector("#download-config-button")?.textContent).toContain(
        "Télécharger la configuration"
      );
      expect(document.querySelector("#open-import-config-modal")?.textContent).toContain(
        "Importer une configuration"
      );
    });

    it("Should display the projected content among the buttons", async () => {
      @Component({
        imports: [HomeActionBar],
        template: `<dash-home-action-bar
          ><span id="projected-content"></span
        ></dash-home-action-bar>`
      })
      class HostComponent {}

      const hostFixture = TestBed.createComponent(HostComponent);
      await hostFixture.whenStable();
      expect(
        (hostFixture.nativeElement as HTMLElement).querySelector(
          "#action-bar-buttons #projected-content"
        )
      ).not.toBeNull();
    });
  });

  describe("Outputs", () => {
    it("Should ask to add a widget", () => {
      expect(
        countEmissions("newWidgetRequested", () =>
          getElement<HTMLButtonElement>("#open-add-widget-modal").click()
        )
      ).toEqual(1);
    });

    it("Should toggle the edit mode", async () => {
      expect(
        countEmissions("editModeToggled", () =>
          getElement<HTMLButtonElement>("#toggle-edit-mode-button").click()
        )
      ).toEqual(1);

      fixture.componentRef.setInput("editModeEnabled", true);
      await fixture.whenStable();
      expect(
        countEmissions("editModeToggled", () =>
          getElement<HTMLButtonElement>("#validate-widget-list-button").click()
        )
      ).toEqual(1);
    });

    it("Should ask to refresh all the widgets", () => {
      expect(
        countEmissions("refreshRequested", () =>
          getElement<HTMLButtonElement>("#reload-all-widgets-button").click()
        )
      ).toEqual(1);
    });

    it("Should ask to download and import the configuration, and to log out", async () => {
      await openUserMenu();
      expect(
        countEmissions("configDownloadRequested", () =>
          document.querySelector<HTMLElement>("#download-config-button")?.click()
        )
      ).toEqual(1);

      await openUserMenu();
      expect(
        countEmissions("configImportRequested", () =>
          document.querySelector<HTMLElement>("#open-import-config-modal")?.click()
        )
      ).toEqual(1);

      await openUserMenu();
      expect(
        countEmissions("logoutRequested", () =>
          document.querySelector<HTMLElement>("#logout-button")?.click()
        )
      ).toEqual(1);
    });

    it("Should switch between light and dark mode", async () => {
      const darkThemeToggles: boolean[] = [];
      fixture.componentInstance.darkThemeToggled.subscribe((isDarkTheme) =>
        darkThemeToggles.push(isDarkTheme)
      );
      await openUserMenu();
      const toggle =
        await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(
          MatSlideToggleHarness
        );
      expect(await toggle.isChecked()).toBe(false);

      await toggle.toggle();
      expect(darkThemeToggles).toEqual([true]);

      fixture.componentRef.setInput("isDarkTheme", true);
      await fixture.whenStable();
      expect(await toggle.isChecked()).toBe(true);

      await toggle.toggle();
      expect(darkThemeToggles).toEqual([true, false]);
    });
  });
});
