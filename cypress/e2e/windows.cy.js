/// <reference types="cypress" />

describe('$Window Component', () => {
	beforeEach(() => {
		cy.visit('cypress/fixtures/window-test-page.html');
		cy.viewport(300, 300);
	});

	// TODO: test menu bar in window; should be hidden when minimized (FIXME), and should be visible when restored; keyboard scope
	// also focus management with iframes and setting z-index, tabstop wrapping...
	// minimize() while minimized, maximize() while maximized, restore() while normal, close() after closing, etc.

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
					$window.close(); // free up slot (unminimizing should also do this, tested elsewhere)
					$window3.minimize();
					cy.get('.window').should('have.length', 2);
					cy.get('.window').last().should('have.css', 'bottom', '-3px');
					cy.get('.window').last().should('have.css', 'left', '10px');
				});
			});
		});
	});

	it('can be minimized/restored by clicking the minimize button', () => {
		cy.window().then((win) => {
			const $window = win.$Window({
				title: 'Test Window',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true,
			});
			cy.get('.window-minimize-button').click();
			// These exact values may not be perfectly accurate to Windows 98, but it's easier to test exact values than proximity.
			cy.get('.window').should('have.css', 'bottom', '-3px'); // result of `calc(100% - ${titlebar_height + 5}px)`
			cy.get('.window').should('have.css', 'left', '10px'); // hardcoded `spacing`

			cy.then(() => {
				win.$Window({
					title: 'Test Window 2',
					minimizeButton: true,
				});
				cy.get('.window-minimize-button').last().click();
				cy.get('.window').last().should('have.css', 'bottom', '-3px');
				cy.get('.window').last().should('have.css', 'left', '170px'); // result of `spacing` + `to_width` + `spacing`
				cy.then(() => {
					win.$Window({
						title: 'Test Window 3',
						minimizeButton: true,
					});
					$window.restore(); // free up slot (closing should also do this, tested elsewhere)
					cy.get('.window').should('have.length', 3);
					cy.get('.window-minimize-button').last().click();
					cy.get('.window').last().should('have.css', 'bottom', '-3px');
					cy.get('.window').last().should('have.css', 'left', '10px');
				});
			});
		});
	});

	it('can be dragged by the title bar', () => {
		cy.window().then((win) => {
			const $window = win.$Window({
				title: 'Test Window',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true,
			});
			$window.$content.append('<p>Drag me!</p>').css("padding", "30px");
			cy.get('.window-titlebar').trigger('pointerdown', { which: 1 });
			cy.get('.window-titlebar').trigger('pointermove', { clientX: 0, clientY: 0 });
			cy.get('.window').should('have.css', 'left').and('match', /^-?\d+px$/);
			cy.get('.window').should('have.css', 'top').and('match', /^-?\d+px$/);
			cy.get('.window-titlebar').trigger('pointerup', { force: true });
			// It should then snap such that you can still reach the title bar
			// TODO: test horizontal clamping (vertical is easier since it should stop at zero, whereas horizontally it can go off screen _partially_)
			cy.get('.window').should('have.css', 'top', '0px');
		});
	});

	it('can be maximized/restored by double-clicking the title bar (and cannot be dragged while maximized)', () => {
		cy.window().then((win) => {
			const $window = win.$Window({
				title: 'Double Click Me!',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true,
				resizable: true,
			});
			$window.$content.append('<p>Titlebar double click maximization test window</p>').css("padding", "30px");
			// Maximize
			cy.get('.window-titlebar').dblclick();
			cy.get('.window').should('have.css', 'top', '0px');
			cy.get('.window').should('have.css', 'left', '0px');
			// FIXME: weird scrollbar logic (the window itself is causing a scrollbar (though not when maximized) and it's reserving space for it.
			// I could make it move the window offscreen to the left/top before detecting the scrollbar width, but that would only mitigate the issue.
			// Is there a way I can make it account for the scrollbar dynamically, rather than detecting the scrollbar width at one point in time?
			// cy.get('.window').should('have.css', 'width', '300px');
			cy.get('.window').should('have.css', 'height', '300px');

			// Try dragging the maximized window
			cy.get('.window-titlebar').trigger('pointerdown', { which: 1 });
			cy.get('.window-titlebar').trigger('pointermove', { clientX: 50, clientY: 50 });
			cy.get('.window').should('have.css', 'top', '0px');
			cy.get('.window').should('have.css', 'left', '0px');
			// cy.get('.window').should('have.css', 'width', '300px'); // see above
			cy.get('.window').should('have.css', 'height', '300px');

			// Restore
			// TODO: test rectangle matches original window rectangle
			cy.get('.window-titlebar').dblclick();
			cy.get('.window').should('not.have.css', 'top', '0px');
			cy.get('.window').should('not.have.css', 'left', '0px');
			cy.get('.window').should('not.have.css', 'width', '300px');
			cy.get('.window').should('not.have.css', 'height', '300px');
		});
	});

	it('can be maximized/restored by clicking the maximize button', () => {
		cy.window().then((win) => {
			const $window = win.$Window({
				title: 'Maximize Me!',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true,
				resizable: true,
			});
			$window.$content.append('<p>Maximize button test window</p>').css("padding", "30px");
			cy.get('.window-maximize-button').should('have.class', 'window-action-maximize');
			cy.get('.window-maximize-button').click();
			cy.get('.window').should('have.css', 'top', '0px');
			cy.get('.window').should('have.css', 'left', '0px');
			// cy.get('.window').should('have.css', 'width', '300px'); // see above
			cy.get('.window').should('have.css', 'height', '300px');
			cy.get('.window-maximize-button').should('have.class', 'window-action-restore');

			// Restore
			cy.get('.window-maximize-button').click();
			cy.get('.window').should('not.have.css', 'top', '0px');
			cy.get('.window').should('not.have.css', 'left', '0px');
			cy.get('.window').should('not.have.css', 'width', '300px');
			cy.get('.window').should('not.have.css', 'height', '300px');
			cy.get('.window-maximize-button').should('have.class', 'window-action-maximize');
		});
	});

	it('can be closed by clicking the close button', () => {
		cy.window().then((win) => {
			const $window = win.$Window({
				title: 'Close Me!',
			});
			$window.$content.append('<p>Close me!</p>').css("padding", "30px");
			cy.get('.window-close-button').click();
			cy.get('.window').should('not.exist');
		});
	});

	it('can be resized horizontally by dragging the left edge', () => {
		cy.window().then((win) => {
			const $window = win.$Window({
				title: 'Resizable Window',
				resizable: true,
			});
			$window.$content.append('<p>Resize me!</p>').css("padding", "30px");
			const rect = $window.element.getBoundingClientRect();
			const leftHandlePos = { x: rect.left, y: rect.top + rect.height / 2 };
			const leftHandle = win.document.elementFromPoint(leftHandlePos.x, leftHandlePos.y);
			cy.wrap(leftHandle).trigger('pointerdown', { which: 1 });
			// Try moving in both axes to test that only one direction is allowed
			cy.wrap(leftHandle).trigger('pointermove', { clientX: leftHandlePos.x - 50, clientY: leftHandlePos.y - 50 });
			cy.then(() => {
				const newRect = $window.element.getBoundingClientRect();
				expect(newRect.left).to.be.lessThan(rect.left);
				expect(newRect.right).to.be.closeTo(rect.right, 1);
				expect(newRect.top).to.be.closeTo(rect.top, 1);
				expect(newRect.bottom).to.be.closeTo(rect.bottom, 1);
			});
			cy.wrap(leftHandle).trigger('pointerup', { force: true });

			// TODO: test corner handles, default clamping, and `options.constrainRect` API clamping
		});
	});

	describe('title()', () => {
		it('should set the title of the window', () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
				});
				cy.get('.window-title').should('have.text', 'Test Window');
				cy.then(() => {
					$window.title('New Title');
				});
				cy.get('.window-title').should('have.text', 'New Title');
				cy.then(() => {
					// @ts-ignore
					$window.title(420);
				});
				cy.get('.window-title').should('have.text', '420');
			});
		});
		it('should clear the title if given an empty string', () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
				});
				cy.get('.window-title').should('have.text', 'Test Window');
				cy.then(() => {
					$window.title('');
				});
				cy.get('.window-title').should('have.text', '');
			});
		});
		it('should return the current title if called without arguments', () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
				});
				expect($window.title()).to.equal('Test Window');
			});
		});
	});
});

