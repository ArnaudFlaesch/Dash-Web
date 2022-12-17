import { defineConfig } from 'cypress';

export default defineConfig({
  watchForFileChanges: false,
  defaultCommandTimeout: 6000,
  viewportWidth: 1920,
  viewportHeight: 1080,
  screenshotOnRunFailure: true,
  video: false,
  videoCompression: false,
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-e2e-config.json'
  },
  env: {
    backend_url: 'localhost:8080'
  },
  e2e: {
    retries: {
      runMode: 2
    },
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.ts')(on, config);
    },
    baseUrl: 'http://localhost:4200/',
    specPattern: 'cypress/e2e/**/**/*.spec.ts'
  }
});
