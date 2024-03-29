import { defineConfig } from 'cypress';

export default defineConfig({
  watchForFileChanges: false,
  defaultCommandTimeout: 4000,
  viewportWidth: 1920,
  viewportHeight: 1080,
  screenshotOnRunFailure: false,
  video: false,
  videoCompression: false,
  env: {
    coverage: false,
    backend_url: 'localhost:8080'
  },
  e2e: {
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts')(on, config);
    },
    baseUrl: 'http://localhost:4200/',
    specPattern: 'cypress/e2e/**/**/*.spec.ts'
  }
});
