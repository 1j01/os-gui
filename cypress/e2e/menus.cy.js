/// <reference types="cypress" />

describe('MenuBar Component', () => {
	beforeEach(() => {
		cy.visit('cypress/fixtures/menu-bar-test-page.html');
		cy.viewport(300, 300);
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
		// TODO: test triggering items with access keys, and cycling items with ambiguous access keys
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

	it('should open/close submenu on hover', () => {
		cy.get('.menu-button').eq(1).click();
		const menuItem = cy.get('.menu-popup .menu-item[aria-haspopup="true"]').first();
		menuItem.trigger('pointerenter');
		menuItem.should('have.attr', 'aria-expanded', 'true');
		menuItem.next().trigger('pointerenter');
		menuItem.should('have.attr', 'aria-expanded', 'false');
	});

	it('should navigate menu using arrow keys', () => {
		cy.get('.menu-button').first().click();
		cy.get('.menu-button').first().type('{downarrow}');
		cy.get('.menu-item').first().should('have.class', 'highlight');
		cy.get(':focus').type('{downarrow}');
		cy.get('.menu-item').eq(1).should('have.class', 'highlight');
		cy.get(':focus').type('{uparrow}');
		cy.get('.menu-item').first().should('have.class', 'highlight');
		// TODO: test wrapping, submenus, moving between top level menus,
		// moving between top level menus without opening them (after pressing Escape),
		// home/end keys, enter, space, etc.
	});

	// TODO: disable interacting with disabled items
	it.skip('should not interact with disabled menu items', () => {
		cy.get('.menu-button').last().click();
		cy.get('.menu-item[aria-disabled="true"]').click();
		cy.get('.menu-popup').should('be.visible'); // Still open because the disabled item didn't trigger close
		cy.window().its('testState.disabledActionTriggered').should('be.false');
	});

	it('should trigger action on menu item click', () => {
		cy.get('.menu-button').first().click();
		cy.get('.menu-popup .menu-item').first().click();
		cy.window().its('testState.fileOpenTriggered').should('be.true');
	});

	it('should exit one menu level when pressing Escape', () => {
		// TODO: test with submenus
		cy.get('.menu-button').first().click();
		cy.get('.menu-popup').should('be.visible');
		cy.get('body').type('{esc}');
		cy.get('.menu-popup').should('not.be.visible');
	});
});
