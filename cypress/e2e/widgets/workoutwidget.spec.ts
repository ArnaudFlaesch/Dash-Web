/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing';

describe('Workout Widget tests', () => {
  const mockedDateTime = new Date(2022, 8, 10, 0, 0, 0).getTime();

  const tabName = 'Workout';

  beforeEach(() => cy.navigateToTab(tabName));

  before(() => cy.createNewTab(tabName));

  after(() => cy.deleteTab(tabName));

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
        cy.get('.workoutTypeName')
          .should('have.length', 1)
          .should('have.text', newWorkoutTypeName);
      });
  });

  it('Should add a new workout session', () => {
    cy.intercept('POST', `/workoutWidget/createWorkoutSession`)
      .as('createWorkoutSession')
      .clock(mockedDateTime)
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
      })
      .clock()
      .then((clock) => {
        clock.restore();
      });
  });

  it('Should add a new workout exercise', () => {
    cy.clock(mockedDateTime)
      .intercept('GET', '/workoutWidget/workoutExercises?workoutSessionId*')
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
          .should('have.text', `Session du 10/09/2022`)
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
      })
      .clock()
      .then((clock) => {
        clock.restore();
      });
  });
});
