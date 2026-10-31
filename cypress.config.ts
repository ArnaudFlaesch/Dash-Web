import { defineConfig } from "cypress";
import { displayBrowserInFullSize } from "./cypress/plugins";

export default defineConfig({
  e2e: {
    setupNodeEvents(on) {
      on("before:browser:launch", displayBrowserInFullSize);
    },
    baseUrl: "http://localhost:4200/",
    specPattern: "cypress/e2e/**/*.spec.ts",
    watchForFileChanges: false,
    defaultCommandTimeout: 4000,
    viewportWidth: 1920,
    viewportHeight: 1080,
    screenshotOnRunFailure: false,
    expose: {
      BACKEND_URL: "localhost:8080"
    }
  }
});
