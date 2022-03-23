// eslint-disable-next-line no-undef
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['./setup-jest.ts', 'jest-date-mock'],
  testPathIgnorePatterns: ['./cypress/'],
  collectCoverage: true,
  moduleNameMapper: {
    'ng2-charts': '<rootDir>/node_modules/ng2-charts/fesm2020/ng2-charts.mjs',
    '^lodash-es$': 'lodash'
  },
  coverageDirectory: 'coverage-jest/',
  globalSetup: 'jest-preset-angular/global-setup'
};
