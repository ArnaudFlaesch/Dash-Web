import Control from "ol/control/Control";

export interface SidebarOptions {
  element: HTMLElement;
  position?: "left" | "right";
}

/** OpenLayers control displaying a collapsible sidebar, with tabs opening their panes. */
export class SidebarControl extends Control {
  private readonly sidebarElement: HTMLElement;
  private readonly tabItems: HTMLElement[];
  private readonly panes: HTMLElement[];
  private readonly closeButtons: HTMLElement[];

  public constructor(options: SidebarOptions) {
    super({ element: options.element });
    this.sidebarElement = options.element;
    this.sidebarElement.classList.add(`sidebar-${options.position ?? "left"}`);

    const container = this.sidebarElement.querySelector(".sidebar-content");
    this.tabItems = Array.from(
      this.sidebarElement.querySelectorAll(".sidebar-tabs > ul > li, ul.sidebar-tabs > li")
    );
    this.panes = Array.from(container?.querySelectorAll<HTMLElement>(".sidebar-pane") ?? []);
    this.closeButtons = Array.from(
      container?.querySelectorAll<HTMLElement>(".sidebar-close") ?? []
    );

    this.bindEvents();
  }

  public open(id: string): this {
    this.panes.forEach((pane) => {
      pane.classList.toggle("active", pane.id === id);
    });

    this.tabItems.forEach((tab) => {
      const link = tab.querySelector("a");
      tab.classList.toggle("active", link?.hash === `#${id}`);
    });

    this.sidebarElement.classList.remove("collapsed");
    return this;
  }

  public close(): this {
    this.tabItems.forEach((tab) => tab.classList.remove("active"));
    this.sidebarElement.classList.add("collapsed");
    return this;
  }

  private bindEvents(): void {
    this.tabItems.forEach((tab) => {
      const link = tab.querySelector("a");
      if (link?.getAttribute("href")?.startsWith("#")) {
        link.addEventListener("click", (evt: Event) => {
          evt.preventDefault();
          this.onTabClick(tab);
        });
      }
    });

    this.closeButtons.forEach((button) => {
      button.addEventListener("click", (evt: Event) => {
        evt.preventDefault();
        this.close();
      });
    });
  }

  private onTabClick(tab: HTMLElement): void {
    if (tab.classList.contains("active")) {
      this.close();
    } else if (!tab.classList.contains("disabled")) {
      const hash = tab.querySelector("a")?.hash.slice(1);
      if (hash) {
        this.open(hash);
      }
    }
  }
}
