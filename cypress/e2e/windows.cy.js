/// <reference types="cypress" />

describe('$Window Component', () => {
	beforeEach(() => {
		cy.visit('cypress/fixtures/window-test-page.html');
		cy.viewport(300, 300);
	});

	// TODO: test menu bar in window; should be hidden when minimized (FIXME), and should be visible when restored; keyboard scope
	// also, window dragging, resizing, restoring from maximize, restoring from minimize, and focus management with iframes and setting z-index, tabstop wrapping...

	it('should minimize to the bottom left by default', () => {
		cy.window().then((win) => {
			const $window = win.$Window({
				title: 'Test Window',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true,
			});
			$window.minimize();
			// These exact values may not be perfectly accurate to Windows 98, but it's easier to test exact values than proximity.
			cy.get('.window').should('have.css', 'bottom', '-3px'); // result of `calc(100% - ${titlebar_height + 5}px)`
			cy.get('.window').should('have.css', 'left', '10px'); // hardcoded `spacing`

			cy.then(() => {
				const $window2 = win.$Window({
					title: 'Test Window 2',
					minimizeButton: true,
				});
				$window2.minimize();
				cy.get('.window').last().should('have.css', 'bottom', '-3px');
				cy.get('.window').last().should('have.css', 'left', '170px'); // result of `spacing` + `to_width` + `spacing`
				cy.then(() => {
					const $window3 = win.$Window({
						title: 'Test Window 3',
						minimizeButton: true,
					});
					$window.close(); // free up slot (unminimizing should also do this)
					$window3.minimize();
					cy.get('.window').should('have.length', 2);
					cy.get('.window').last().should('have.css', 'bottom', '-3px');
					cy.get('.window').last().should('have.css', 'left', '10px');
				});
			});
		});
	});
});

