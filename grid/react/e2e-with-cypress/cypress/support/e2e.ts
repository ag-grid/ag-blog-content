// ***********************************************************
// This example support/e2e.ts is processed and
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
import './commands'
import 'cypress-axe';

Cypress.Commands.add('injectAxe', () => {
  cy.window({ log: false }).then((win) => {
    // Inject axe-core runtime into the browser
    // This makes the `axe` global available
    const script = win.document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.6.3/axe.min.js';
    win.document.head.appendChild(script);
  });
});

Cypress.Commands.add('checkA11y', (context, options = {}, violationCallback) => {
  // By default, run on the entire document if 'context' is not provided
  cy.window({ log: false }).then((win) => {
    return new Promise((resolve) => {
      win.axe.run(context || win.document, options, (error, results) => {
        if (error) throw error;
        if (results.violations.length) {
          if (violationCallback) {
            violationCallback(results.violations);
          } else {
            cy.log('Accessibility violations found:', results.violations);
          }
        }
        resolve(results);
      });
    });
  });
});
