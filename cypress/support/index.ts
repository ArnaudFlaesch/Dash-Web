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

import 'cypress-wait-until';

Cypress.Commands.add('loginAsAdmin', (): Cypress.Chainable<Response> => {
  return loginAs('admintest', 'adminpassword');
});

Cypress.Commands.add('loginAsUser', (): Cypress.Chainable<Response> => {
  return loginAs('usertest', 'userpassword');
});

function loginAs(
  username: string,
  password: string
): Cypress.Chainable<Response> {
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
