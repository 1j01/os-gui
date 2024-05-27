/// <reference types="cypress" />

describe('MenuBar Component', () => {
	beforeEach(() => {
		cy.visit('cypress/fixtures/menu-bar-test-page.html');
	});

	it('should load the menu bar', () => {
		cy.get('[role="menubar"]').should('exist');
	});

	it('should open/close menu on click', () => {
		cy.get('.menu-button').first().click();
		cy.get('.menu-popup').should('be.visible');
		cy.get('.menu-button').first().click();
		cy.get('.menu-popup').should('not.be.visible');
	});

	it('should close menu when clicking outside', () => {
		cy.get('.menu-button').first().click();
		cy.get('.menu-popup').should('be.visible');
		cy.get('body').click();
		cy.get('.menu-popup').should('not.be.visible');
	});

	it('should open menu when pressing access key shortcut', () => {
		cy.get('body').type('{alt}f');
		cy.get('.menu-button').first().should('have.attr', 'aria-expanded', 'true');
	});

	it('should have correct ARIA attributes', () => {
		cy.get('.menu-button').first().click();
		cy.get('.menu-button, .menu-item').each(($el) => {
			cy.wrap($el).should('have.attr', 'role').and('match', /^(menuitem|menuitemcheckbox|menuitemradio)$/);
		});
		cy.get('.menu-popup').each(($el) => {
			cy.wrap($el).should('have.attr', 'role', 'menu');
		});
	});
});
