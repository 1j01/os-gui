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

	describe('getIconAtSize()', () => {
		it('should return an icon of the requested size', () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder'),
						any: new Text('any size placeholder'),
					},
				});
				expect($window.getIconAtSize(16)).to.have.property('textContent', '16x16 placeholder');
				expect($window.getIconAtSize(32)).to.have.property('textContent', '32x32 placeholder');
			});
		});
		it('should return an icon of the closest size if none match and no "any" size is provided', () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder'),
					},
				});
				expect($window.getIconAtSize(0)).to.have.property('textContent', '16x16 placeholder');
				expect($window.getIconAtSize(17)).to.have.property('textContent', '16x16 placeholder');
				expect($window.getIconAtSize(30)).to.have.property('textContent', '32x32 placeholder');
				expect($window.getIconAtSize(300)).to.have.property('textContent', '32x32 placeholder');
			});
		});
		it('should return the "any" size icon if provided and none match exactly', () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder'),
						any: new Text('any size placeholder'),
					},
				});
				expect($window.getIconAtSize(17)).to.have.property('textContent', 'any size placeholder');
				expect($window.getIconAtSize(30)).to.have.property('textContent', 'any size placeholder');
				expect($window.getIconAtSize(32)).to.have.property('textContent', '32x32 placeholder');
			});
		});
	});

	describe('setIcons()', () => {
		it('should set the icons of the window', () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
				});
				$window.setIcons({
					16: new Text('16x16 placeholder'),
					32: new Text('32x32 placeholder'),
					any: new Text('any size placeholder'),
				});
				expect($window.getIconAtSize(16)).to.have.property('textContent', '16x16 placeholder');
				expect($window.getIconAtSize(32)).to.have.property('textContent', '32x32 placeholder');
				expect($window.getIconAtSize(17)).to.have.property('textContent', 'any size placeholder');
				expect($window.getIconAtSize(30)).to.have.property('textContent', 'any size placeholder');

				// It's actually not wrapped in an element, which is a little weird.
				// If you pass it a text node, it's added directly to the titlebar.
				cy.get('.window').contains('16x16 placeholder');
			});
		});
		it('should clear the icons if called with an empty object', () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder'),
						any: new Text('any size placeholder'),
					},
				});
				$window.setIcons({});
				expect($window.getIconAtSize(16)).to.be.null;
				expect($window.getIconAtSize(32)).to.be.null;
				expect($window.getIconAtSize(17)).to.be.null;
				expect($window.getIconAtSize(30)).to.be.null;
			});
		});
	});

	describe("focus management", () => {
		// Test cases where it should refocus the last focused control in the window:
		// - Click in the blank space of the window
		//   - Click in blank space again now that something's focused
		// - Click on the window title bar
		//   - Click on title bar buttons
		// - Closing a second window should focus the first window
		//   - Open a dialog window from an app window that has a tool window, then close the dialog window
		//     - @TODO: Even if the tool window has controls, it should focus the parent window, I think
		// - Clicking on a control in the window should focus said control
		// - Clicking on a disabled control in the window should focus the window
		//   - Make sure to test this with another window previously focused
		// - Simulated clicks (important for JS Paint's eye gaze and speech recognition modes)
		// - (@TODO: Should clicking a child window focus the parent window?)
		// - After potentially selecting text but not selecting anything
		// It should NOT refocus when:
		// - Clicking on a control in a different window
		// - When other event handlers set focus
		//   - Using the keyboard to focus something outside the window, such as a menu popup
		//   - Clicking a control that focuses something outside the window
		//     - Button that opens another window (e.g. Recursive Dialog button in tests)
		//     - Button that focuses a control in another window (e.g. Focus Other button in tests)
		// - Trying to select text

		it("should focus the window when clicking in the blank space of the window", () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
				});
				$window.$content.append('<p>Click in the blank space of the window</p>');
				cy.get('.window').should('not.have.focus');
				cy.get('.window-content').click();
				cy.get('.window-content').should('have.focus');
			});
		});
		it("should focus the window when clicking on the title bar", () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
				});
				$window.$content.append('<p>Click on the title bar</p>');
				cy.get('.window').should('not.have.focus');
				cy.get('.window-titlebar').click();
				cy.get('.window-content').should('have.focus');
			});
		});
		it("should focus a control in the window when clicking it", () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
				});
				$window.$content.append('<form><input type="text" id="input" value="Click me"><textarea id="textarea">Text area</textarea></form>');
				cy.get('#input').should('not.have.focus');
				cy.get('#input').click();
				cy.get('#input').should('have.focus');
				cy.get('body').click({ force: true });
				cy.get('#input').should('not.have.focus');
				cy.then(() => { expect(win.document.activeElement).to.equal(win.document.body); });
				// refocusing logic should not override clicking a specific control
				cy.get('#textarea').click();
				cy.get('#textarea').should('have.focus');
			});
		});
		// I think Cypress's focus simulation logic breaks these tests.
		// It seems like a pain to debug, given that it's essentially three layers of focus management, maybe four:
		// - The OS-GUI.js library's management (mimicking an operating system)
		// - Cypress's focus management (mimicking a browser)
		// - The browser's focus management
		// - The operating system's focus management (can largely ignore this)
		// That said, I haven't digged into this beyond stepping in the debugger into "interceptFocus" from `cypress_runner.js`.
		// I expected there would be problems with testing focus, but at least I got some tests working.
		it.skip("should focus the last focused control in the window when clicking a disabled control", () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Test Window',
				});
				$window.$content.append('<button id="disabled-button" disabled>Can\'t click me</button><button id="enabled-button">Click me</button>');
				// cy.get('#disabled-button').click({ force: true });
				cy.get('#disabled-button').trigger('pointerdown', { which: 1, force: true });
				// cy.get('.window-content').should('have.focus');
				cy.then(() => { expect(win.document.activeElement).to.equal(win.document.querySelector('.window-content')); });
				cy.get('#enabled-button').click();
				cy.get('#enabled-button').should('have.focus');
				// cy.get('#disabled-button').click({ force: true });
				cy.get('#disabled-button').trigger('pointerdown', { which: 1, force: true });
				cy.get('#enabled-button').should('have.focus');
				cy.get('body').click({ force: true });
				cy.then(() => { expect(win.document.activeElement).to.equal(win.document.body); });
				// cy.get('#disabled-button').click({ force: true });
				cy.get('#disabled-button').trigger('pointerdown', { which: 1, force: true });
				cy.get('#enabled-button').should('have.focus');
			});
		});
		it.skip("should focus the last focused control in the window when closing another window that was focused", () => {
			cy.window().then((win) => {
				const $window = win.$Window({
					title: 'Original Window',
				});
				$window.$content.append('<p>Window originally having focus <textarea id="textarea">Text area</textarea></p>');
				cy.get('#textarea').focus();
				cy.get('#textarea').should('have.focus');
				const $window2 = win.$Window({
					title: 'Popup Window',
				});
				$window2.$content.append('<p>Window taking focus temporarily</p><p><button id="close-popup">Close</button></p>');
				cy.get('#close-popup').focus();
				cy.get('#close-popup').should('have.focus');
				cy.get('.window-close-button').last().click();
				// cy.get('#textarea').should('have.focus');
				cy.then(() => { expect(win.document.activeElement).to.equal(win.document.getElementById('textarea')); });
			});
		});
	});
});

