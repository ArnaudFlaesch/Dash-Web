/// <reference types="cypress" />

/** Launches the browser at the same 1920x1080 resolution as the configured viewport. */
export function displayBrowserInFullSize(
  browser: Cypress.Browser,
  launchOptions: Cypress.BeforeBrowserLaunchOptions
): Cypress.BeforeBrowserLaunchOptions {
  console.log("launching browser %s is headless? %s", browser.name, browser.isHeadless);

  // the browser width and height we want to get
  // our screenshots and videos will be of that resolution
  const width = 1920;
  const height = 1080;

  console.log("setting the browser window size to %d x %d", width, height);

  if (browser.name === "chrome" && browser.isHeadless) {
    launchOptions.args.push(`--window-size=${width},${height}`);

    // force screen to be non-retina and just use our given resolution
    launchOptions.args.push("--force-device-scale-factor=1");
  }

  if (browser.name === "electron" && browser.isHeadless) {
    // might not work on CI for some reason
    launchOptions.preferences.width = width;
    launchOptions.preferences.height = height;
  }

  if (browser.name === "firefox" && browser.isHeadless) {
    launchOptions.args.push(`--width=${width}`, `--height=${height}`);
  }

  // IMPORTANT: return the updated browser launch options
  return launchOptions;
}
