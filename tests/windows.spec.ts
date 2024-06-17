import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';

test.describe('$Window Component', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 300, height: 300 });

		const filePath = __dirname + '/../cypress/fixtures/window-test-page.html';
		await page.goto(pathToFileURL(filePath).href);
	});

	// TODO: test focus management with iframes and setting z-index...
	// minimize() while minimized, maximize() while maximized, restore() while normal, close() after closing,
	// minimize()/maximize()/restore() while dragging/resizing window,
	// trying to drag/resize while minimize/maximize animation is in progress,
	// trying to drag/resize while maximized (maybe already tested),
	// queuing up multiple minimize/maximize/restore actions,
	// other API methods/options.

	test('should minimize to the bottom left by default', async ({ page }) => {
		await page.evaluate(() => {
			const $window = $Window({
				title: 'Test Window',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true
			});
			$window.minimize();
			window.first_$window = $window;
		});
		// These exact values may not be perfectly accurate to Windows 98, but it's easier to test exact values than proximity.
		await expect(page.locator('.window')).toHaveCSS('bottom', '-3px'); // result of `calc(100% - ${titlebar_height + 5}px)`
		await expect(page.locator('.window')).toHaveCSS('left', '10px'); // hardcoded `spacing`


		await page.evaluate(() => {
			const $window2 = $Window({
				title: 'Test Window 2',
				minimizeButton: true
			});
			$window2.minimize();
		});
		await expect(page.locator('.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window').last()).toHaveCSS('left', '170px'); // result of `spacing` + `to_width` + `spacing`

		await page.evaluate(() => {
			const $window3 = $Window({
				title: 'Test Window 3',
				minimizeButton: true
			});
			window.first_$window.close(); // free up slot (unminimizing should also do this, tested elsewhere)
			$window3.minimize();
		});
		await expect(page.locator('.window')).toHaveCount(2);
		await expect(page.locator('.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window').last()).toHaveCSS('left', '10px');
	});

	test('can be minimized/restored by clicking the minimize button', async ({ page }) => {
		await page.evaluate(() => {
			const $window = $Window({
				title: 'Test Window',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true
			});
		});
		await page.locator(
			'.window-minimize-button').click();
		// These exact values may not be perfectly accurate to Windows 98, but it's easier to test exact values than proximity.
		await expect(page.locator('.window')).toHaveCSS('bottom', '-3px'); // result of `calc(100% - ${titlebar_height + 5}px)`
		await expect(page.locator('.window')).toHaveCSS('left', '10px'); // hardcoded `spacing`

		await page.evaluate(() => {
			$Window({
				title: 'Test Window 2',
				minimizeButton: true
			});
		});
		await page.locator(
			'.window-minimize-button').last().click();
		await expect(page.locator(
			'.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator(
			'.window').last()).toHaveCSS('left', '170px'); // result of `spacing` + `to_width` + `spacing`

		await page.evaluate(() => {
			$Window({
				title: 'Test Window 3',
				minimizeButton: true
			});
			$window.restore(); // free up slot (closing should also do this, tested elsewhere)
		});
		await expect(page.locator('.window')).toHaveCount(3);
		await page.locator(
			'.window-minimize-button').last().click();
		await expect(page.locator(
			'.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator(
			'.window').last()).toHaveCSS('left', '10px');
	});

	test('can be dragged by the title bar', async ({ page }) => {
		await page.evaluate(() => {
			const $window = $Window({
				title: 'Test Window',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true
			});
			$window.$content.append('<p>Drag me!</p>').css("padding", "30px");
		});
		await page.locator(
			'.window-titlebar').dispatchEvent('pointerdown', { which: 1 });
		await page.locator(
			'.window-titlebar').dispatchEvent('pointermove', { clientX: 0, clientY: 0 });
		await expect(page.locator(
			'.window')).toHaveCSS('left', /.*/);
		await expect.poll(async () => page.locator('.window').evaluateAll((elements, match) => { const matches = new Set(document.querySelectorAll(match)); return !!elements.find((e) => matches.has(e)); }, /^-?\d+px$/)).toBeTruthy();
		await expect(page.locator(
			'.window')).toHaveCSS('top', /.*/);
		await expect.poll(async () => page.locator('.window').evaluateAll((elements, match) => { const matches = new Set(document.querySelectorAll(match)); return !!elements.find((e) => matches.has(e)); }, /^-?\d+px$/)).toBeTruthy();
		await page.locator(
			'.window-titlebar').dispatchEvent('pointerup');
		// It should then snap such that you can still reach the title bar
		// TODO: test horizontal clamping (vertical is easier since it should stop at zero, whereas horizontally it can go off screen _partially_)
		await expect(page.locator('.window')).toHaveCSS('top', '0px');
	});

	test('can be maximized/restored by double-clicking the title bar (and cannot be dragged while maximized)', async ({ page }) => {
		await page.evaluate(() => {
			const $window = $Window({
				title: 'Double Click Me!',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true,
				resizable: true
			});
			$window.$content.append('<p>Titlebar double click maximization test window</p>').css("padding", "30px");
		});
		// Maximize
		await page.locator('.window-titlebar').dblclick();
		await expect(page.locator(
			'.window')).toHaveCSS('top', '0px');
		await expect(page.locator(
			'.window')).toHaveCSS('left', '0px');
		// FIXME: weird scrollbar logic (the window itself is causing a scrollbar (though not when maximized) and it's reserving space for it.
		// I could make it move the window offscreen to the left/top before detecting the scrollbar width, but that would only mitigate the issue.
		// Is there a way I can make it account for the scrollbar dynamically, rather than detecting the scrollbar width at one point in time?
		// cy.get('.window').should('have.css', 'width', '300px');
		await expect(page.locator('.window')).toHaveCSS('height', '300px');

		// Try dragging the maximized window
		await page.locator('.window-titlebar').dispatchEvent('pointerdown', { which: 1 });
		await page.locator(
			'.window-titlebar').dispatchEvent('pointermove', { clientX: 50, clientY: 50 });
		await expect(page.locator(
			'.window')).toHaveCSS('top', '0px');
		await expect(page.locator(
			'.window')).toHaveCSS('left', '0px');
		// cy.get('.window').should('have.css', 'width', '300px'); // see above
		await expect(page.locator('.window')).toHaveCSS('height', '300px');

		// Restore
		// TODO: test rectangle matches original window rectangle
		await page.locator('.window-titlebar').dblclick();
		await expect(page.locator(
			'.window')).not.toHaveCSS('top', '0px');
		await expect(page.locator(
			'.window')).not.toHaveCSS('left', '0px');
		await expect(page.locator(
			'.window')).not.toHaveCSS('width', '300px');
		await expect(page.locator(
			'.window')).not.toHaveCSS('height', '300px');

	});

	test('can be maximized/restored by clicking the maximize button', async ({ page }) => {
		await page.evaluate(() => {
			const $window = $Window({
				title: 'Maximize Me!',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true,
				resizable: true
			});
			$window.$content.append('<p>Maximize button test window</p>').css("padding", "30px");
		});
		await expect(page.locator(
			'.window-maximize-button')).toHaveClass(/window-action-maximize/);
		await page.locator(
			'.window-maximize-button').click();
		await expect(page.locator(
			'.window')).toHaveCSS('top', '0px');
		await expect(page.locator(
			'.window')).toHaveCSS('left', '0px');
		// cy.get('.window').should('have.css', 'width', '300px'); // see above
		await expect(page.locator('.window')).toHaveCSS('height', '300px');
		await expect(page.locator(
			'.window-maximize-button')).toHaveClass(/window-action-restore/);

		// Restore
		await page.locator('.window-maximize-button').click();
		await expect(page.locator(
			'.window')).not.toHaveCSS('top', '0px');
		await expect(page.locator(
			'.window')).not.toHaveCSS('left', '0px');
		await expect(page.locator(
			'.window')).not.toHaveCSS('width', '300px');
		await expect(page.locator(
			'.window')).not.toHaveCSS('height', '300px');
		await expect(page.locator(
			'.window-maximize-button')).toHaveClass(/window-action-maximize/);
	});

	test('can be closed by clicking the close button', async ({ page }) => {
		await page.evaluate(() => {
			const $window = $Window({
				title: 'Close Me!'
			});
			$window.$content.append('<p>Close me!</p>').css("padding", "30px");
		});
		await page.locator(
			'.window-close-button').click();
		await expect(page.locator(
			'.window')).not.toBeVisible();
	});

	test('can be resized horizontally by dragging the left edge', async ({ page }) => {
		await page.evaluate(() => {
			const $window = $Window({
				title: 'Resizable Window',
				resizable: true
			});
			$window.$content.append('<p>Resize me!</p>').css("padding", "30px");
			const rect = $window.element.getBoundingClientRect();
			const leftHandlePos = { x: rect.left, y: rect.top + rect.height / 2 };
			const leftHandle = document.elementFromPoint(leftHandlePos.x, leftHandlePos.y);
		});
		await (
			leftHandle.dispatchEvent('pointerdown', { which: 1 }));
		// Try moving in both axes to test that only one direction is allowed
		await leftHandle.dispatchEvent('pointermove', { clientX: leftHandlePos.x - 50, clientY: leftHandlePos.y - 50 });

		const newRect = $window.element.getBoundingClientRect();
		expect(
			newRect.left).FIXME_be_lessThan(rect.left);
		expect(
			newRect.right).FIXME_be_closeTo(rect.right, 1);
		expect(
			newRect.top).FIXME_be_closeTo(rect.top, 1);
		expect(
			newRect.bottom).FIXME_be_closeTo(rect.bottom, 1);
		await (

			leftHandle.dispatchEvent('pointerup'));

		// TODO: test corner handles, default clamping, and `options.constrainRect` API clamping
	});

	test.describe('title()', () => {
		test('should set the title of the window', async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
			});
			await expect(page.locator(
				'.window-title')).toHaveText('Test Window');

			$window.title('New Title');
			await expect(page.locator(

				'.window-title')).toHaveText('New Title');

			// @ts-ignore
			$window.title(420);
			await expect(page.locator(

				'.window-title')).toHaveText('420');
		});
		test('should clear the title if given an empty string', async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
			});
			await expect(page.locator(
				'.window-title')).toHaveText('Test Window');

			$window.title('');
			await expect(page.locator(

				'.window-title')).toHaveText('');
		});
		test('should return the current title if called without arguments', async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				expect(
					$window.title()).toBe('Test Window');
			});
		});
	});

	test.describe('getIconAtSize()', () => {
		test('should return an icon of the requested size', async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder'),
						any: new Text('any size placeholder')
					}
				});
				expect(
					$window.getIconAtSize(16)).toHaveProperty('textContent', '16x16 placeholder');
				expect(
					$window.getIconAtSize(32)).toHaveProperty('textContent', '32x32 placeholder');
			});

		});
		test('should return an icon of the closest size if none match and no "any" size is provided', async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder')
					}
				});
				expect(
					$window.getIconAtSize(0)).toHaveProperty('textContent', '16x16 placeholder');
				expect(
					$window.getIconAtSize(17)).toHaveProperty('textContent', '16x16 placeholder');
				expect(
					$window.getIconAtSize(30)).toHaveProperty('textContent', '32x32 placeholder');
				expect(
					$window.getIconAtSize(300)).toHaveProperty('textContent', '32x32 placeholder');
			});
		});
		test('should return the "any" size icon if provided and none match exactly', async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder'),
						any: new Text('any size placeholder')
					}
				});
				expect(
					$window.getIconAtSize(17)).toHaveProperty('textContent', 'any size placeholder');
				expect(
					$window.getIconAtSize(30)).toHaveProperty('textContent', 'any size placeholder');
				expect(
					$window.getIconAtSize(32)).toHaveProperty('textContent', '32x32 placeholder');
			});

		});
	});

	test.describe('setIcons()', () => {
		test('should set the icons of the window', async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				$window.setIcons({
					16: new Text('16x16 placeholder'),
					32: new Text('32x32 placeholder'),
					any: new Text('any size placeholder')
				});
				expect(
					$window.getIconAtSize(16)).toHaveProperty('textContent', '16x16 placeholder');
				expect(
					$window.getIconAtSize(32)).toHaveProperty('textContent', '32x32 placeholder');
				expect(
					$window.getIconAtSize(17)).toHaveProperty('textContent', 'any size placeholder');
				expect(
					$window.getIconAtSize(30)).toHaveProperty('textContent', 'any size placeholder');
			});

			// It's actually not wrapped in an element, which is a little weird.
			// If you pass it a text node, it's added directly to the titlebar.
			await expect(page.locator('.window').getByText(/16x16 placeholder/).first()).toBeVisible();

		});
		test('should clear the icons if called with an empty object', async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder'),
						any: new Text('any size placeholder')
					}
				});
				$window.setIcons({});
				expect(
					$window.getIconAtSize(16)).toBeNull();
				expect(
					$window.getIconAtSize(32)).toBeNull();
				expect(
					$window.getIconAtSize(17)).toBeNull();
				expect(
					$window.getIconAtSize(30)).toBeNull();
			});
		});
	});

	test.describe('setMenuBar', () => {
		test('should add menu bar, which is hidden when minimized', async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				const menu = new MenuBar({
					"&File": [
						{
							label: "&Open",
							action: () => {
								alert("Open");
							}
						},
						{
							label: "&Close",
							action: () => {
								alert("Close");
							}
						}]

				});
				$window.setMenuBar(menu);
			});
			await expect(page.locator(
				'[role="menubar"]')).toBeVisible();
			$window.minimize();
			await expect(page.locator(

				'.window-titlebar')).toHaveCount(1); // wait for titlebar animation to finish
			// move the window so the menu bar is visible if it's broken
			await page.locator('.window-titlebar').dispatchEvent('pointerdown', { which: 1 });
			await page.locator(
				'.window-titlebar').dispatchEvent('pointermove', { clientX: 150, clientY: 150 });
			await page.locator(
				'.window-titlebar').dispatchEvent('pointerup');
			// not a strong enough assertion, since it considers offscreen elements hidden
			// (you can test with `Cypress.dom.isVisible(document.querySelector("[role=menubar]"))` in the console)
			await expect(page.locator('[role="menubar"]')).not.toBeVisible();
			// stronger assertion
			await expect(page.locator('[role="menubar"]')).toHaveCSS('display', 'none');
			$window.restore();
			await expect(page.locator(
				'[role="menubar"]')).toBeVisible();
		});
		test('should set up the correct keyboard scope', async ({ page }) => {
			let activated_menu_item = false;
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				$window.$content.append('<p>Click in the blank space of the window</p>');
				const menu = new MenuBar({
					"&Test": [
						{
							label: "&Activate Menu Item",
							action: () => {
								activated_menu_item = true;
							}
						}]

				});
				$window.setMenuBar(menu);
			});

			// works while window is focused
			await page.locator('.window-content').click();
			await page.keyboard.down("Alt");
			await page.locator(
				'body').fill("t");
			await page.keyboard.up("Alt");
			await page.locator('body').press("Enter");
			// Can't use cy.wrap(activated_menu_item).should('be.true') because it would be synchronously accessing the value before commands are run
			expect(
				activated_menu_item).toBeTruthy();
			activated_menu_item = false;
			// @ts-ignore
			document.activeElement.blur();

			// does nothing while window is not focused
			await page.locator('body').click();
			await page.keyboard.down("Alt");
			await page.locator(
				'body').fill("t");
			await page.keyboard.up("Alt");
			await page.locator('body').press("Enter");
			expect(

				activated_menu_item).FIXME_be_false();

		});
	});

	test.describe("focus management", () => {
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

		test("should focus the window when clicking in the blank space of the window", async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				$window.$content.append('<p>Click in the blank space of the window</p>');
			});
			await page.locator(
				'.window').FIXME_should('not.have.focus');
			await page.locator(
				'.window-content').click();
			await page.locator(
				'.window-content').FIXME_should('have.focus');

		});
		test("should focus the window when clicking on the title bar", async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				$window.$content.append('<p>Click on the title bar</p>');
			});
			await page.locator(
				'.window').FIXME_should('not.have.focus');
			await page.locator(
				'.window-titlebar').click();
			await page.locator(
				'.window-content').FIXME_should('have.focus');

		});
		test("should focus a control in the window when clicking it", async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				$window.$content.append('<form><input type="text" id="input" value="Click me"><textarea id="textarea">Text area</textarea></form>');
			});
			await page.locator(
				'#input').FIXME_should('not.have.focus');
			await page.locator(
				'#input').click();
			await page.locator(
				'#input').FIXME_should('have.focus');
			await page.locator(
				'body').click();
			await page.locator(
				'#input').FIXME_should('not.have.focus');
			expect(document.activeElement).toBe(
				document.body);
			// refocusing logic should not override clicking a specific control
			await page.locator('#textarea').click();
			await page.locator(
				'#textarea').FIXME_should('have.focus');

		});
		// I think Cypress's focus simulation logic breaks these tests.
		// It seems like a pain to debug, given that it's essentially three layers of focus management, maybe four:
		// - The OS-GUI.js library's management (mimicking an operating system)
		// - Cypress's focus management (mimicking a browser)
		// - The browser's focus management
		// - The operating system's focus management (can largely ignore this)
		// That said, I haven't digged into this beyond stepping in the debugger into "interceptFocus" from `cypress_runner.js`.
		// I expected there would be problems with testing focus, but at least I got some tests working.
		test.skip("should focus the last focused control in the window when clicking a disabled control", async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				$window.$content.append('<button id="disabled-button" disabled>Can\'t click me</button><button id="enabled-button">Click me</button>');
			});
			// cy.get('#disabled-button').click({ force: true });
			await page.locator('#disabled-button').dispatchEvent('pointerdown', { which: 1 });
			// cy.get('.window-content').should('have.focus');
			expect(document.activeElement).toBe(document.querySelector('.window-content'));
			await page.locator(
				'#enabled-button').click();
			await page.locator(
				'#enabled-button').FIXME_should('have.focus');
			// cy.get('#disabled-button').click({ force: true });
			await page.locator('#disabled-button').dispatchEvent('pointerdown', { which: 1 });
			await page.locator(
				'#enabled-button').FIXME_should('have.focus');
			await page.locator(
				'body').click();
			expect(document.activeElement).toBe(
				document.body);
			// cy.get('#disabled-button').click({ force: true });
			await page.locator('#disabled-button').dispatchEvent('pointerdown', { which: 1 });
			await page.locator(
				'#enabled-button').FIXME_should('have.focus');
		});
		test.skip("should focus the last focused control in the window when closing another window that was focused", async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Original Window'
				});
				$window.$content.append('<p>Window originally having focus <textarea id="textarea">Text area</textarea></p>');
			});
			await page.locator(
				'#textarea').focus();
			await page.locator(
				'#textarea').FIXME_should('have.focus');
			const $window2 = $Window({
				title: 'Popup Window'
			});
			$window2.$content.append('<p>Window taking focus temporarily</p><p><button id="close-popup">Close</button></p>');
			await page.locator(
				'#close-popup').focus();
			await page.locator(
				'#close-popup').FIXME_should('have.focus');
			await page.locator(
				'.window-close-button').last().click();
			// cy.get('#textarea').should('have.focus');
			expect(document.activeElement).toBe(document.getElementById('textarea'));
		});
		// test.describe("tabstop wrapping", () => {
		// SEE tests/tabstop-wrapping.spec.ts
		// });
	});
});