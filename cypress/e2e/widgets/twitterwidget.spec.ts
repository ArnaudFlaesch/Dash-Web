/// <reference types="cypress" />
import { Interception } from 'cypress/types/net-stubbing';

xdescribe('Twitter Widget tests', () => {
  const tabName = 'Twitter';

  beforeEach(() => cy.loginAsAdmin().navigateToTab(tabName));

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget('TWITTER'));

  after(() => cy.loginAsAdmin().navigateToTab(tabName).deleteTab(tabName));

  const usersToFollow = ['StackOverflow', 'Microsoft', 'Apple'];

  it('Should insert users to follow', () => {
    usersToFollow.forEach((user) => {
      cy.intercept('POST', `/twitterWidget/addFollowedUser*`)
        .as('addFollowedUser')
        .get('#searchTwitterUserLabel')
        .click();
      cy.get('#searchTwitterUserInput').clear();
      cy.get('#searchTwitterUserInput').type(user);
      cy.get('#addFollowedUserButton').click();
      cy.wait('@addFollowedUser').then((response: Interception) => {
        expect(response.response.statusCode).to.equal(200);
        cy.get('.followed-user').should('have.length', 1);
      });
    });
  });

  it('Should select a user to display its timeline', () => {
    cy.intercept('GET', `/twitterWidget/followed?search=${usersToFollow[0]}`)
      .as('searchFollowedUser')
      .intercept('PATCH', `/widget/updateWidgetData/*`)
      .as('updateWidget');
    cy.get('#searchTwitterUserLabel').click();
    cy.get('#searchTwitterUserInput').type(usersToFollow[0]);
    cy.wait('@searchFollowedUser').then((searchUsersResponse: Interception) => {
      expect(searchUsersResponse.response.statusCode).to.equal(200);
      cy.get('.followed-user').should('have.length', 1).click();
      cy.get('.validateButton').click();
      cy.wait('@updateWidget').then((updateWidgetResponse: Interception) => {
        expect(updateWidgetResponse.response.statusCode).to.equal(200);
      });
    });
  });

  it('Should remove followed users', () => {
    cy.get('.editButton').click();
    usersToFollow.forEach((user) => {
      cy.intercept('DELETE', `/twitterWidget/deleteFollowedUser?followedUserId=*`)
        .as('removeFollowedUser')
        .intercept('GET', `/twitterWidget/followed?search=${user}`)
        .as('searchFollowedUser')
        .get('#searchTwitterUserLabel')
        .click();
      cy.get('#searchTwitterUserInput').clear();
      cy.get('#searchTwitterUserInput').type(user);
      cy.wait('@searchFollowedUser').then((searchUsersResponse: Interception) => {
        expect(searchUsersResponse.response.statusCode).to.equal(200);
        cy.get('.delete-followed-user-button').should('have.length', 1).click();
        cy.wait('@removeFollowedUser').then((response: Interception) => {
          expect(response.response.statusCode).to.equal(200);
          cy.get('.followed-user').should('have.length', 0);
        });
      });
    });
  });
});
