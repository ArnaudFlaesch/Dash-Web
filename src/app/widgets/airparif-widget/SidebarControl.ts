import { SidebarOptions } from "./airparif-map/airparif-map.component";
import Control from "ol/control/Control";

export class SidebarControl extends Control {
  private readonly sidebarElement: HTMLElement;
  private readonly container: HTMLElement | null;
  private readonly tabItems: HTMLElement[];
  private readonly panes: HTMLElement[];
  private readonly closeButtons: HTMLElement[];

  public constructor(options: SidebarOptions) {
    const el =
      typeof options.element === "string"
        ? document.getElementById(options.element)
        : options.element;

    if (!el) {
      throw new Error("Sidebar element not found");
    }

    super({ element: el });
    this.sidebarElement = el;

    const position = options.position ?? "left";
    this.sidebarElement.classList.add(`sidebar-${position}`);

    this.container = this.sidebarElement.querySelector(".sidebar-content");
    this.tabItems = Array.from(
      this.sidebarElement.querySelectorAll(".sidebar-tabs > ul > li, ul.sidebar-tabs > li")
    );
    this.panes = this.container ? Array.from(this.container.querySelectorAll(".sidebar-pane")) : [];
    this.closeButtons = this.container
      ? Array.from(this.container.querySelectorAll(".sidebar-close"))
      : [];

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
      if (link && link.getAttribute("href")?.startsWith("#")) {
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
      const link = tab.querySelector("a");
      const hash = link?.hash?.slice(1);
      if (hash) {
        this.open(hash);
      }
    }
  }
}
