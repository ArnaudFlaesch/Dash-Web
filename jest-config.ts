const jestConfig = {
  preset: "jest-preset-angular",
  setupFilesAfterEnv: ["./setup-jest.ts", "jest-date-mock"],
  testPathIgnorePatterns: ["./cypress/"],
  collectCoverage: true,
  moduleNameMapper: {
    "ng2-charts": "<rootDir>/node_modules/ng2-charts/fesm2022/ng2-charts.mjs",
    "^lodash-es$": "lodash"
  },
  coverageDirectory: "coverage-jest/"
};

export default jestConfig;
