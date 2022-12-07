/// <reference types="cypress" />
import { Interception } from 'cypress/types/net-stubbing';

describe('Twitter Widget tests', () => {
  const tabName = 'Twitter';

  beforeEach(() => cy.navigateToTab(tabName));

  before(() => cy.createNewTab(tabName));

  after(() => cy.deleteTab(tabName));

  const usersToFollow = ['StackOverflow', 'Microsoft', 'Apple'];

  it('Should create a Twitter Widget and add it to the dashboard', () => {
    cy.intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#openAddWidgetModal')
      .click()
      .get('#TWITTER')
      .click()
      .wait('@addWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 1);
      });
  });

  it('Should insert users to follow', () => {
    usersToFollow.forEach((user) => {
      cy.intercept('POST', `/twitterWidget/addFollowedUser*`)
        .as('addFollowedUser')
        .get('#searchTwitterUserLabel')
        .click()
        .get('#searchTwitterUserInput')
        .clear()
        .type(user)
        .get('#addFollowedUserButton')
        .click()
        .wait('@addFollowedUser')
        .then((response: Interception) => {
          expect(response.response.statusCode).to.equal(200);
          cy.get('.followed-user').should('have.length', 1);
        });
    });
  });

  it('Should select a user to display its timeline', () => {
    cy.intercept('GET', `/twitterWidget/followed?search=${usersToFollow[0]}`)
      .as('searchFollowedUser')
      .intercept('PATCH', `/widget/updateWidgetData/*`)
      .as('updateWidget')
      .get('#searchTwitterUserLabel')
      .click()
      .get('#searchTwitterUserInput')
      .clear()
      .type(usersToFollow[0])
      .wait('@searchFollowedUser')
      .then((searchUsersResponse: Interception) => {
        expect(searchUsersResponse.response.statusCode).to.equal(200);
        cy.get('.followed-user')
          .should('have.length', 1)
          .click()
          .get('.validateButton')
          .click()
          .wait('@updateWidget')
          .then((updateWidgetResponse: Interception) => {
            expect(updateWidgetResponse.response.statusCode).to.equal(200);
          });
      });
  });

  it('Should remove followed users', () => {
    cy.get('.editButton').click();
    usersToFollow.forEach((user) => {
      cy.intercept(
        'DELETE',
        `/twitterWidget/deleteFollowedUser?followedUserId=*`
      )
        .as('removeFollowedUser')
        .intercept('GET', `/twitterWidget/followed?search=${user}`)
        .as('searchFollowedUser')
        .get('#searchTwitterUserLabel')
        .click()
        .get('#searchTwitterUserInput')
        .clear()
        .type(user)
        .wait('@searchFollowedUser')
        .then((searchUsersResponse: Interception) => {
          expect(searchUsersResponse.response.statusCode).to.equal(200);
          cy.get('.deleteFollowedUserButton')
            .should('have.length', 1)
            .click()
            .wait('@removeFollowedUser')
            .then((response: Interception) => {
              expect(response.response.statusCode).to.equal(200);
              cy.get('.followed-user').should('have.length', 0);
            });
        });
    });
  });
});
