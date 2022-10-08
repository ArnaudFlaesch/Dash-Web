/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

import 'cypress-file-upload';
import 'cypress-wait-until';

Cypress.Commands.add('loginAsAdmin', (): Cypress.Chainable<Response> => {
  return loginAs('admintest', 'adminpassword');
});

Cypress.Commands.add('loginAsUser', (): Cypress.Chainable<Response> => {
  return loginAs('usertest', 'userpassword');
});

Cypress.Commands.add('navigateToTab', (tabName: string): Cypress.Chainable => {
  return navigateToTab(tabName);
});

Cypress.Commands.add('createNewTab', (tabName: string): Cypress.Chainable => {
  return createNewTab(tabName);
});

Cypress.Commands.add('deleteTab', (tabName: string): Cypress.Chainable => {
  return deleteTab(tabName);
});

function loginAs(username: string, password: string): Cypress.Chainable<Response> {
  return cy
    .request('POST', `${Cypress.env('backend_url')}/auth/login`, {
      username: username,
      password: password
    })
    .its('body')
    .then((response) => {
      window.localStorage.setItem('user', JSON.stringify(response));
    });
}

function navigateToTab(tabName: string): Cypress.Chainable {
  return cy
    .intercept('GET', '/tab/')
    .as('getTabs')
    .intercept('GET', '/widget/?tabId=*')
    .as('getWidgets')
    .loginAsAdmin()
    .visit('/')
    .wait('@getTabs')
    .then((getTabResponse: Interception) => {
      expect(getTabResponse.response.statusCode).to.equal(200);
      cy.get('.tab')
        .contains(tabName)
        .click()
        .wait('@getWidgets')
        .then((getWidgetsResponse: Interception) => {
          expect(getWidgetsResponse.response.statusCode).to.equal(200);
        });
    });
}

function createNewTab(tabName: string): Cypress.Chainable {
  return cy
    .intercept('GET', '/tab/')
    .as('getTabs')
    .intercept('POST', '/tab/addTab')
    .as('createTab')
    .intercept('POST', '/tab/updateTab')
    .as('updateTab')
    .loginAsAdmin()
    .visit('/')
    .wait('@getTabs')
    .then((getTabsResponse) => {
      expect(getTabsResponse.response.statusCode).to.equal(200);
      cy.get('#addNewTabButton')
        .click()
        .wait('@createTab')
        .then((createTabResponse) => {
          cy.get('.tab:nth(-1) .tabLabel')
            .click()
            .dblclick()
            .get('input')
            .clear()
            .type(tabName)
            .dblclick()
            .wait('@updateTab')
            .then((updateTabResponse: Interception) => {
              expect(updateTabResponse.response.statusCode).to.equal(200);
              cy.get('.tab.selected-item .tabLabel')
                .invoke('text')
                .then((text) => {
                  expect(text.trim()).equal(tabName);
                });
            });
        });
    });
}

function deleteTab(tabName: string): Cypress.Chainable {
  return cy
    .intercept('GET', '/tab/')
    .as('getTabs')
    .intercept('DELETE', '/tab/deleteTab/*')
    .as('deleteTab')
    .loginAsAdmin()
    .visit('/')
    .wait('@getTabs')
    .then((getTabsResponse: Interception) => {
      expect(getTabsResponse.response.statusCode).to.equal(200);
      cy.get('.tab')
        .contains(tabName)
        .dblclick()
        .get('.deleteTabButton')
        .click()
        .wait('@deleteTab')
        .then((deleteTabResponse: Interception) => {
          expect(deleteTabResponse.response.statusCode).to.equal(200);
        });
    });
}
