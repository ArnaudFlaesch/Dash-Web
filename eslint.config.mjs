// @ts-check
import js from "@eslint/js";
import angular from "angular-eslint";
import vitest from "@vitest/eslint-plugin";
import pluginCypress from "eslint-plugin-cypress";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    ".angular",
    "bundle-stats",
    "coverage",
    "cypress/downloads",
    "cypress/reports",
    "cypress/results",
    "dist",
    "documentation",
    "out-tsc"
  ]),

  {
    name: "dash/linter-options",
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error"
    }
  },

  // JavaScript & TypeScript: shared base
  {
    name: "dash/javascript",
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    extends: [js.configs.recommended]
  },

  // TypeScript: type-aware linting
  {
    name: "dash/typescript",
    files: ["**/*.{ts,mts,cts}"],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked
    ],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.ts"]
        },
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // `||` is intentionally used to fall back on empty strings
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: { string: true } }
      ]
    }
  },

  // Angular application code (components, directives, services, …)
  {
    name: "dash/angular",
    files: ["src/**/*.ts"],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    languageOptions: {
      globals: globals.browser
    },
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "dash", style: "camelCase" }
      ],
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "dash", style: "kebab-case" }
      ]
    }
  },

  // Angular templates (external .html and inline templates)
  {
    name: "dash/angular-templates",
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility
    ]
  },

  // Vitest unit tests
  {
    name: "dash/vitest",
    files: ["src/**/*.spec.ts"],
    extends: [vitest.configs.recommended],
    settings: {
      vitest: { typecheck: true }
    },
    rules: {
      // Assertions are also made by helpers and by HttpTestingController
      "vitest/expect-expect": [
        "error",
        {
          assertFunctionNames: [
            "expect",
            "expect*",
            "httpTestingController.expect*"
          ]
        }
      ],
      // Vitest accepts a custom message as second argument
      "vitest/valid-expect": ["error", { maxArgs: 2 }]
    }
  },

  // Cypress end-to-end tests
  {
    name: "dash/cypress",
    files: ["cypress/**/*.ts"],
    extends: [pluginCypress.configs.recommended]
  },

  // Tests: Angular TestBed and Cypress APIs expose many `any` values
  // (nativeElement, componentInstance, request bodies…)
  {
    name: "dash/tests",
    files: ["src/**/*.spec.ts", "src/**/*-fixtures.ts", "cypress/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off"
    }
  },

  // Node.js tooling (config files at the project root)
  {
    name: "dash/node-tooling",
    files: ["*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: globals.node
    }
  },

  // Must stay last: turns off rules conflicting with Prettier
  eslintConfigPrettier
]);
