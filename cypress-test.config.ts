import { defineConfig } from "cypress";
import { displayBrowserInFullSize } from "./cypress/plugins";

export default defineConfig({
  e2e: {
    retries: {
      runMode: 2
    },
    setupNodeEvents(on, config) {
      on("before:browser:launch", displayBrowserInFullSize);
    },
    baseUrl: "http://localhost:4200/",
    specPattern: "cypress/e2e/**/**/*.spec.ts",
    watchForFileChanges: false,
    defaultCommandTimeout: 8000,
    viewportWidth: 1920,
    viewportHeight: 1080,
    screenshotOnRunFailure: true,
    video: false,
    videoCompression: false,
    reporter: "cypress-multi-reporters",
    reporterOptions: {
      configFile: "reporter-e2e-config.json"
    },
    env: {
      backend_url: "localhost:8080"
    }
  }
});
