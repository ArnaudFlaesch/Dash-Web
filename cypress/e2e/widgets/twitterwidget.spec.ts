/// <reference types="cypress" />
import { Interception } from 'cypress/types/net-stubbing';

describe('Twitter Widget tests', () => {
  const tabName = 'Twitter';

  beforeEach(() => cy.loginAsAdmin().navigateToTab(tabName));

  before(() => cy.loginAsAdmin().createNewTab(tabName).createWidget('TWITTER'));

  after(() => cy.loginAsAdmin().deleteTab(tabName));

  const usersToFollow = ['StackOverflow', 'Microsoft', 'Apple'];

  it('Should insert users to follow', () => {
    usersToFollow.forEach((user) => {
      cy.intercept('POST', `/twitterWidget/addFollowedUser*`)
        .as('addFollowedUser')
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
