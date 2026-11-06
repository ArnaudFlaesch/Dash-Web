import { SidebarControl } from "./sidebar-control";

describe("SidebarControl", () => {
  /** Sidebar with a tab opening the home pane, a disabled tab and an external link. */
  function createSidebarElement(): HTMLElement {
    const element = document.createElement("div");
    element.innerHTML = `
      <div class="sidebar-tabs">
        <ul>
          <li id="home-tab"><a href="#home">Home</a></li>
          <li id="settings-tab" class="disabled"><a href="#settings">Settings</a></li>
          <li id="external-tab"><a href="https://www.airparif.asso.fr">Airparif</a></li>
        </ul>
      </div>
      <div class="sidebar-content">
        <div class="sidebar-pane" id="home"><button class="sidebar-close">Close</button></div>
        <div class="sidebar-pane" id="settings"></div>
      </div>`;
    element.classList.add("collapsed");
    return element;
  }

  function click(element: Element | null): MouseEvent {
    const event = new MouseEvent("click", { cancelable: true });
    element?.dispatchEvent(event);
    return event;
  }

  it("should be positioned on the left by default", () => {
    const element = createSidebarElement();
    new SidebarControl({ element });
    expect(element.classList).toContain("sidebar-left");
  });

  it("should be positioned on the right", () => {
    const element = createSidebarElement();
    new SidebarControl({ element, position: "right" });
    expect(element.classList).toContain("sidebar-right");
    expect(element.classList).not.toContain("sidebar-left");
  });

  it("should open a pane, then close the sidebar", () => {
    const element = createSidebarElement();
    const sidebar = new SidebarControl({ element });

    expect(sidebar.open("home")).toBe(sidebar);
    expect(element.classList).not.toContain("collapsed");
    expect(element.querySelector("#home")?.classList).toContain("active");
    expect(element.querySelector("#settings")?.classList).not.toContain("active");
    expect(element.querySelector("#home-tab")?.classList).toContain("active");
    expect(element.querySelector("#settings-tab")?.classList).not.toContain("active");

    expect(sidebar.close()).toBe(sidebar);
    expect(element.classList).toContain("collapsed");
    expect(element.querySelector("#home-tab")?.classList).not.toContain("active");
  });

  it("should toggle the pane of a tab when the tab is clicked", () => {
    const element = createSidebarElement();
    new SidebarControl({ element });
    const homeLink = element.querySelector("#home-tab a");

    const openEvent = click(homeLink);
    expect(openEvent.defaultPrevented).toBe(true);
    expect(element.classList).not.toContain("collapsed");
    expect(element.querySelector("#home")?.classList).toContain("active");

    click(homeLink);
    expect(element.classList).toContain("collapsed");
    expect(element.querySelector("#home-tab")?.classList).not.toContain("active");
  });

  it("should not open the pane of a disabled tab", () => {
    const element = createSidebarElement();
    new SidebarControl({ element });

    click(element.querySelector("#settings-tab a"));

    expect(element.classList).toContain("collapsed");
    expect(element.querySelector("#settings")?.classList).not.toContain("active");
  });

  it("should not handle the click on a link which is not a tab", () => {
    const element = createSidebarElement();
    new SidebarControl({ element });
    const externalLink = element.querySelector("#external-tab a") as HTMLAnchorElement;
    let isPreventedBySidebar: boolean | undefined;
    // Called after the listeners of the sidebar, the navigation is not supported by the tests
    externalLink.addEventListener("click", (event) => {
      isPreventedBySidebar = event.defaultPrevented;
      event.preventDefault();
    });

    click(externalLink);

    expect(isPreventedBySidebar).toBe(false);
    expect(element.classList).toContain("collapsed");
  });

  it("should close the sidebar with the close button", () => {
    const element = createSidebarElement();
    const sidebar = new SidebarControl({ element });
    sidebar.open("home");

    const event = click(element.querySelector(".sidebar-close"));

    expect(event.defaultPrevented).toBe(true);
    expect(element.classList).toContain("collapsed");
  });

  it("should support tabs directly in a list, and a sidebar without content", () => {
    const element = document.createElement("div");
    element.innerHTML = `<ul class="sidebar-tabs"><li id="tab"><a href="#">Empty</a></li></ul>`;
    const sidebar = new SidebarControl({ element });

    // A tab without pane cannot be opened
    click(element.querySelector("#tab a"));
    expect(element.querySelector("#tab")?.classList).not.toContain("active");

    sidebar.open("unknown");
    expect(element.classList).not.toContain("collapsed");
    expect(element.querySelector("#tab")?.classList).not.toContain("active");
  });
});
