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

	it('should glide through menus (open menu on hover while another menu is open)', () => {
		cy.get('.menu-button').first().trigger('pointerdown');
		cy.get('.menu-popup:visible').contains('Open');
		cy.get('.menu-button').eq(1).trigger('pointermove'); // I wonder if there's a reason it doesn't use pointerenter
		cy.get('.menu-popup:visible').contains('Checkbox State');
		// It should stay in gliding state even after the mouse button is released
		cy.get('.menu-button').eq(1).trigger('pointerup');
		cy.get('.menu-popup:visible').contains('Checkbox State'); // (should stay open btw)
		cy.get('.menu-button').eq(2).trigger('pointermove');
		cy.get('.menu-popup:visible').contains('Copy');
	});

	it('should open menus and activate menu items with access keys', () => {
		cy.get('body').type('{alt}f');
		cy.get('.menu-button').first().should('have.attr', 'aria-expanded', 'true');
		// Menu item with action
		cy.window().its('testState.fileOpenTriggered').should('be.false');
		cy.get('body').type('o');
		cy.window().its('testState.fileOpenTriggered').should('be.true');
		// Menu should be closed after action is triggered
		cy.get('.menu-button').first().should('have.attr', 'aria-expanded', 'false');
		cy.get('.menu-button').eq(1).should('have.attr', 'aria-expanded', 'false');
		// Checkbox menu item
		cy.get('body').type('{alt}v');
		cy.get('.menu-button').eq(1).should('have.attr', 'aria-expanded', 'true');
		cy.window().its('testState.checkboxState').should('be.false');
		cy.contains('Checkbox State').first().parent("[role='menuitemcheckbox']").should('have.attr', 'aria-checked', 'false');
		cy.get('body').type('s');
		cy.window().its('testState.checkboxState').should('be.true');
		cy.contains('Checkbox State').first().parent("[role='menuitemcheckbox']").should('have.attr', 'aria-checked', 'true');
		// Menu should be closed after checkbox is toggled
		// TODO: match Windows behavior
		// cy.get('.menu-button').first().should('have.attr', 'aria-expanded', 'false');
		// cy.get('.menu-button').eq(1).should('have.attr', 'aria-expanded', 'false');
		cy.get('body').type('{esc}');
		// Submenu item
		cy.get('body').type('{alt}v').type('m');
		// Should cycle through items with ambiguous access keys,
		// including menu items without defined access keys, which use the first letter of the label.
		// TODO: make sure both implicit and explicit access keys are tested
		// TODO: test that the items are not activated, only highlighted
		cy.get('.menu-item.highlight').contains('Item 0');
		cy.get('body').type('i');
		cy.get('.menu-item.highlight').contains('Item 1');
		cy.get('body').type('i');
		cy.get('.menu-item.highlight').contains('Item 2');
		// Should cycle back to the first item
		cy.get('body').type(Array(100 - 2).fill('i').join(''));
		cy.get('.menu-item.highlight').contains('Item 0');

		// TODO: test also ambiguous top level menu access keys (would be really bad practice, but should probably still be supported)
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

	it('should navigate menus using arrow keys', () => {
		// moving between items in the same menu
		cy.get('.menu-button').first().click();
		cy.get('.menu-button').first().type('{downarrow}');
		cy.get('.menu-item:visible').first().should('have.class', 'highlight');
		cy.get(':focus').type('{downarrow}');
		cy.get('.menu-item:visible').eq(1).should('have.class', 'highlight');
		cy.get(':focus').type('{uparrow}');
		cy.get('.menu-item:visible').first().should('have.class', 'highlight');
		// wrapping around within a menu
		cy.get(':focus').type('{uparrow}');
		cy.get('.menu-item:visible').last().should('have.class', 'highlight');
		cy.get(':focus').type('{downarrow}');
		cy.get('.menu-item:visible').first().should('have.class', 'highlight');
		// moving between top level menus while open
		// File menu should be open
		cy.get('.menu-button').first().should('have.attr', 'aria-expanded', 'true');
		cy.get('.menu-popup:visible').contains('Open');
		cy.get(':focus').type('{rightarrow}');
		// View menu should be open
		cy.get('.menu-button').eq(1).should('have.attr', 'aria-expanded', 'true');
		cy.get('.menu-popup:visible').contains('Checkbox State');
		cy.get(':focus').type('{leftarrow}');
		// File menu should be open
		cy.get('.menu-button').first().should('have.attr', 'aria-expanded', 'true');
		cy.get('.menu-popup:visible').contains('Open');
		cy.get(':focus').type('{leftarrow}');
		// cy.get('.menu-popup:visible').contains('Maximize'); // App menu (alt+space menu) would only apply if inside a window, and isn't implemented as of writing
		// Edit menu should be open, wrapping around
		cy.get('.menu-button').last().should('have.attr', 'aria-expanded', 'true');
		cy.get('.menu-popup:visible').contains('Copy');
		cy.get(':focus').type('{rightarrow}');
		// File menu should be open, wrapping around
		cy.get('.menu-button').first().should('have.attr', 'aria-expanded', 'true');
		cy.get('.menu-popup:visible').contains('Open');
		// moving between top level menu buttons without opening menus (after pressing Escape)
		cy.get('body').type('{esc}');
		cy.get('.menu-popup:visible').should('not.exist');
		cy.get('.menu-button').first().should('have.focus').should('have.attr', 'aria-expanded', 'false');
		cy.get(':focus').type('{rightarrow}');
		cy.get('.menu-popup:visible').should('not.exist');
		cy.get('.menu-button').eq(1).should('have.focus').should('have.attr', 'aria-expanded', 'false');
		cy.get(':focus').type('{downarrow}');
		// opening menu from this state by pressing down arrow
		cy.get('.menu-popup:visible').should('exist');
		cy.get('.menu-item:visible').first().should('have.class', 'highlight');
		// or up arrow (and yes, it should still be the first item, to match Windows 98's behavior)
		cy.get('body').type('{esc}');
		cy.get('.menu-popup:visible').should('not.exist');
		cy.get(':focus').type('{uparrow}');
		cy.get('.menu-popup:visible').should('exist');
		cy.get('.menu-item:visible').first().should('have.class', 'highlight');
	});

	it('should enter/exit submenus using arrow keys', () => {
		// test entering/exiting submenus with right/left
		cy.get('.menu-button').eq(1).click();
		cy.get(':focus').type('{downarrow}{downarrow}');
		cy.get('.menu-popup:visible .menu-item[aria-haspopup="true"]').first()
			.should('have.class', 'highlight')
			.should('have.attr', 'aria-expanded', 'false');
		cy.get(':focus').type('{rightarrow}');
		cy.get('.menu-popup:visible .menu-item[aria-haspopup="true"]').first()
			.should('have.class', 'highlight')
			.should('have.attr', 'aria-expanded', 'true');
		cy.then(() => {
			expect(cy.$$('.menu-popup:visible').length).to.equal(2);
		});
		cy.get(':focus').type('{leftarrow}');
		cy.get('.menu-popup:visible .menu-item[aria-haspopup="true"]').first()
			.should('have.class', 'highlight')
			.should('have.attr', 'aria-expanded', 'false');
		cy.then(() => {
			expect(cy.$$('.menu-popup:visible').length).to.equal(1);
		});
		// test reversed left/right interaction in RTL layout
		cy.get(':focus').type('{esc}');
		cy.document().then((doc) => {
			doc.body.style.direction = 'rtl';
		});
		cy.get('.menu-button').eq(1).click();
		cy.get(':focus').type('{downarrow}{downarrow}');
		cy.get('.menu-popup:visible .menu-item[aria-haspopup="true"]').first()
			.should('have.class', 'highlight')
			.should('have.attr', 'aria-expanded', 'false');
		cy.get(':focus').type('{leftarrow}');
		cy.get('.menu-popup:visible .menu-item[aria-haspopup="true"]').first()
			.should('have.class', 'highlight')
			.should('have.attr', 'aria-expanded', 'true');
		cy.then(() => {
			expect(cy.$$('.menu-popup:visible').length).to.equal(2);
		});
		cy.get(':focus').type('{rightarrow}');
		cy.get('.menu-popup:visible .menu-item[aria-haspopup="true"]').first()
			.should('have.class', 'highlight')
			.should('have.attr', 'aria-expanded', 'false');
		cy.then(() => {
			expect(cy.$$('.menu-popup:visible').length).to.equal(1);
		});

		// TODO: test moving to adjacent menu if pressing in the direction opposite the submenu indicator arrow
	});

	it.skip('should (maybe) jump to first/last item using home/end keys (not actually supported in Windows)', () => {
		cy.get('.menu-button').first().click();
		cy.get(':focus').type('{end}');
		cy.get('.menu-item').last().should('have.class', 'highlight');
		cy.get(':focus').type('{home}');
		cy.get('.menu-item').first().should('have.class', 'highlight');
	});

	// TODO: disable interacting with disabled items
	it.skip('should not interact with disabled menu items', () => {
		cy.get('.menu-button').last().click();
		cy.get('.menu-item[aria-disabled="true"]').click();
		cy.get('.menu-popup').should('be.visible'); // Still open because the disabled item didn't trigger close
		cy.window().its('testState.disabledActionTriggered').should('be.false');
	});


	it('should trigger action on menu item click', () => {
		cy.window().its('testState.fileOpenTriggered').should('be.false');
		cy.get('.menu-button').first().click();
		cy.get('.menu-popup .menu-item').first().click();
		cy.window().its('testState.fileOpenTriggered').should('be.true');
	});

	it('should trigger action when pressing enter', () => {
		cy.get('body').type('{alt}f');
		cy.get('.menu-popup:visible .menu-item').first().should('have.class', 'highlight');
		cy.get('.menu-popup:visible').first().should('have.focus');
		cy.window().its('testState.fileOpenTriggered').should('be.false');
		cy.get(':focus').type('{enter}');
		cy.window().its('testState.fileOpenTriggered').should('be.true');
	});

	it('should do nothing when pressing space', () => {
		cy.get('body').type('{alt}f');
		cy.get('.menu-popup:visible .menu-item').first().should('have.class', 'highlight');
		cy.get('.menu-popup:visible').first().should('have.focus');
		cy.window().its('testState.fileOpenTriggered').should('be.false');
		// Cypress was triggering a click command inside type(), and hiding it from the command log, invalidating the test by activating the menu item, unlike real world behavior.
		// I thought it might be assuming it's a button and triggering a click to imitate the default action of buttons when pressing space, but it's not that.
		// It was simply clicking before typing in order to "simulate typical user behavior",
		// because it doesn't consider the menu item to be focused.
		// cy.get('.menu-popup:visible .menu-item.highlight').type(' ', { force: true });
		// Need to use the focused element instead of the highlighted one to avoid the click,
		// and need to ensure the element receives focus beforehand with `should` (above) to avoid it failing to find anything focused here.
		cy.get(':focus').type(' ');
		cy.window().its('testState.fileOpenTriggered').should('be.false');
	});

	it('should exit one menu level when pressing Escape', () => {
		cy.get('.menu-button').first().click();
		cy.get('.menu-popup').should('be.visible');
		cy.get('body').type('{esc}');
		cy.get('.menu-popup').should('not.be.visible');
		// test with submenu
		cy.get('.menu-button').eq(1).click();
		cy.get('.menu-popup .menu-item[aria-haspopup="true"]').first().click();
		cy.then(() => {
			expect(cy.$$('.menu-popup:visible').length).to.equal(2);
		});
		cy.get('body').type('{esc}');
		cy.then(() => {
			expect(cy.$$('.menu-popup:visible').length).to.equal(1);
		});
		cy.get('body').type('{esc}');
		cy.then(() => {
			expect(cy.$$('.menu-popup:visible').length).to.equal(0);
		});
	});

	it('should close all menus when pressing Alt, and refocus the last focused control outside the menu bar', () => {
		cy.then(() => { // not technically needed since it's the first command
			// cy.$$('<button id="focusable">Focus</button>').appendTo('body').focus(); // doesn't work, appends to the wrong document
			// Cypress.$('<button id="focusable">Focus</button>').appendTo('body').focus(); // doesn't work, appends to the wrong document
			Cypress.$('body').append('<button id="focusable">Focus</button>').find('#focusable').focus(); // works
		});
		// cy.document().then((doc) => { // works but verbose
		// 	const button = doc.createElement('button');
		// 	button.id = 'focusable';
		// 	doc.body.appendChild(button);
		// 	button.focus();
		// 	button.textContent = 'Focus';
		// });
		cy.get('#focusable').should('have.focus');

		cy.get('.menu-button').first().click();
		cy.get('.menu-popup').should('be.visible');
		cy.get('#focusable').should('not.have.focus');
		cy.get('body').type('{alt}');
		cy.get('.menu-popup').should('not.be.visible');
		cy.get('#focusable').should('have.focus');
		// test with submenu
		cy.get('.menu-button').eq(1).click();
		cy.get('.menu-popup .menu-item[aria-haspopup="true"]').first().click();
		cy.then(() => {
			expect(cy.$$('.menu-popup:visible').length).to.equal(2);
		});
		cy.get('body').type('{alt}');
		cy.then(() => {
			expect(cy.$$('.menu-popup:visible').length).to.equal(0);
		});
		cy.get('#focusable').should('have.focus');
	});
});
