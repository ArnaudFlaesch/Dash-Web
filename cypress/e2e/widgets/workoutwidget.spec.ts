/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Workout Widget tests', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
      .visit('/')
      .title()
      .should('equals', 'Dash')
      .waitUntil(() => cy.get('.tab.selected-item').should('be.visible'))
      .get('.tab')
      .contains('Workout')
      .click();
  });

  it('Should create a Workout Widget and add it to the dashboard', () => {
    cy.intercept('POST', '/widget/addWidget')
      .as('addWidget')
      .get('#openAddWidgetModal')
      .click()
      .get('#WORKOUT')
      .click()
      .wait('@addWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 1);
      });
  });

  it('Should add a new workout type', () => {
    const newWorkoutTypeName = 'Abdos';
    cy.intercept('POST', `/workoutWidget/addWorkoutType`)
      .as('addWorkoutType')
      .get('.workoutTypeName')
      .should('have.length', 0)
      .get('.workout-session')
      .should('have.length', 0)
      .get('#addWorkoutInput')
      .type(newWorkoutTypeName)
      .get('#addWorkoutTypeButton')
      .click()

      .wait('@addWorkoutType')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.workoutTypeName').should('have.length', 1).should('have.text', newWorkoutTypeName);
      });
  });

  it('Should add a new workout session', () => {
    cy.intercept('POST', `/workoutWidget/createWorkoutSession`)
      .as('createWorkoutSession')
      .get('.workoutTypeName')
      .should('have.length', 1)
      .get('.workout-session')
      .should('have.length', 0)
      .get('#workoutDatePickerField .mat-datepicker-toggle')
      .click()
      .get('.mat-calendar-body-today')
      .click()
      .get('#createWorkoutSessionButton')
      .click()
      .wait('@createWorkoutSession')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.workout-session').should('have.length', 1);
      });
  });

  it('Should add a new workout exercise', () => {
    cy.intercept('GET', '/workoutWidget/workoutExercises?workoutSessionId*')
      .as('getWorkoutExercises')
      .intercept('POST', `/workoutWidget/addWorkoutExercise`)
      .as('addWorkoutExercise')
      .get('.workout-session')
      .should('have.length', 1)
      .get('.workout-session > div:nth(0)')
      .click()
      .wait('@getWorkoutExercises')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('#workoutSessionDate')
          .should('have.text', `Session du ${new Date().toLocaleDateString()}`)
          .intercept('POST', '/workoutWidget/updateWorkoutExercise')
          .as('updateWorkoutExercise')
          .get('.addRepToWorkoutButton')
          .click()
          .wait('@updateWorkoutExercise')
          .then((request: Interception) => {
            expect(request.response.statusCode).to.equal(200);
            expect(request.response.body.numberOfReps).to.equal(1);
            cy.get('.workoutNumberOfReps').should('have.text', 1);
          });
      });
  });

  it('Should delete previously added widget', () => {
    cy.intercept('DELETE', '/widget/deleteWidget/*')
      .as('deleteWidget')
      .get('.widget .deleteButton')
      .click()
      .get('h4')
      .should('have.text', 'Êtes-vous sûr de vouloir supprimer ce widget ?')
      .get('.validateDeletionButton')
      .click()
      .wait('@deleteWidget')
      .then((request: Interception) => {
        expect(request.response.statusCode).to.equal(200);
        cy.get('.widget').should('have.length', 0);
      });
  });
});
