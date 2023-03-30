/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Login tests', () => {
  beforeEach(() => cy.intercept('POST', '/auth/login').as('login').visit('/'));

  it('Should fail to login', () => {
    cy.get('#loginButton').should('be.disabled').get('#inputUsername').type('test');
    cy.get('#inputPassword').type('test');
    cy.get('#loginButton').should('be.enabled').click();
    cy.wait('@login').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(401);
      cy.shouldDisplayErrorMessage("Erreur lors de la connexion de l'utilisateur.");
    });
  });

  it('Should login and logout', () => {
    cy.get('#inputUsername').clear();
    cy.get('#inputUsername').type('admintest');
    cy.get('#inputPassword').clear();
    cy.get('#inputPassword').type('adminpassword');
    cy.get('#loginButton').should('be.enabled').click();
    cy.wait('@login').then((request: Interception) => {
      expect(request.response.statusCode).to.equal(200);
      cy.url().should('be.equal', `${Cypress.config('baseUrl')}home`);
      cy.get('#logoutButton').click();
      cy.waitUntil(() =>
        cy
          .get('#login-page-title')
          .should('have.text', 'Dash')
          .url()
          .should('be.equal', `${Cypress.config('baseUrl')}login`)
      ).then(() => expect(localStorage.getItem('user')).to.be.null);
    });
  });
});
