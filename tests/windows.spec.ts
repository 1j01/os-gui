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

	test('should minimize to the bottom left by default (also, slots can be freed by close)', async ({ page }) => {
		const h$window = await page.evaluateHandle(() => {
			const $window = $Window({
				title: 'Test Window',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true
			});
			$window.minimize();
			return $window;
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

		const h$window3 = await page.evaluateHandle(() => {
			const $window3 = $Window({
				title: 'Test Window 3',
				minimizeButton: true
			});
			return $window3;
		});
		await h$window.evaluate(($window) => {
			$window.close(); // free up slot (unminimizing should also do this, tested elsewhere)
		});
		await h$window3.evaluate(($window3) => {
			$window3.minimize();
		});
		await expect(page.locator('.window')).toHaveCount(2);
		await expect(page.locator('.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window').last()).toHaveCSS('left', '10px');
	});

	test('can be minimized/restored by clicking the minimize button (also, slots can be freed by restore)', async ({ page }) => {
		const h$window = await page.evaluateHandle(() => {
			const $window = $Window({
				title: 'Test Window',
				maximizeButton: true,
				minimizeButton: true,
				closeButton: true
			});
			return $window;
		});
		await page.locator('.window-minimize-button').click();
		// These exact values may not be perfectly accurate to Windows 98, but it's easier to test exact values than proximity.
		await expect(page.locator('.window')).toHaveCSS('bottom', '-3px'); // result of `calc(100% - ${titlebar_height + 5}px)`
		await expect(page.locator('.window')).toHaveCSS('left', '10px'); // hardcoded `spacing`

		await page.evaluate(() => {
			$Window({
				title: 'Test Window 2',
				minimizeButton: true
			});
		});
		await page.locator('.window-minimize-button').last().click();
		await expect(page.locator('.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window').last()).toHaveCSS('left', '170px'); // result of `spacing` + `to_width` + `spacing`

		await page.evaluate(() => {
			$Window({
				title: 'Test Window 3',
				minimizeButton: true
			});
		});
		await h$window.evaluate(($window) => {
			$window.restore(); // free up slot (closing should also do this, tested elsewhere)
		});
		await expect(page.locator('.window')).toHaveCount(3);
		await page.locator('.window-minimize-button').last().click();
		await expect(page.locator('.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window').last()).toHaveCSS('left', '10px');
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
		await page.locator('.window-titlebar').hover();
		await page.mouse.down();
		await page.mouse.move(0, 0);
		await expect(page.locator('.window')).toHaveCSS('left', /^-?\d+(\.\d+)?px$/);
		await expect(page.locator('.window')).toHaveCSS('top', /^-?\d+(\.\d+)?px$/);
		await page.mouse.up();
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
			// Centering avoids a failure in webkit due to it automatically scrolling down
			// presumably when clicking the first time, interrupting the double click.
			$window.center();
		});
		// Maximize
		await page.locator('.window-titlebar').dblclick();
		await expect(page.locator('.window')).toHaveCSS('top', '0px');
		await expect(page.locator('.window')).toHaveCSS('left', '0px');
		// FIXME: weird scrollbar logic (the window itself is causing a scrollbar (though not when maximized) and it's reserving space for it.
		// I could make it move the window offscreen to the left/top before detecting the scrollbar width, but that would only mitigate the issue.
		// Is there a way I can make it account for the scrollbar dynamically, rather than detecting the scrollbar width at one point in time?
		// await expect(page.locator('.window')).toHaveCSS('width', '300px');
		await expect(page.locator('.window')).toHaveCSS('height', '300px');

		// Try dragging the maximized window
		// TODO: use `page.mouse` and such instead of `dispatchEvent`
		await page.locator('.window-titlebar').dispatchEvent('pointerdown', { which: 1 });
		await page.locator('.window-titlebar').dispatchEvent('pointermove', { clientX: 50, clientY: 50 });
		await expect(page.locator('.window')).toHaveCSS('top', '0px');
		await expect(page.locator('.window')).toHaveCSS('left', '0px');
		// await expect(page.locator('.window')).toHaveCSS('width', '300px'); // see above
		await expect(page.locator('.window')).toHaveCSS('height', '300px');

		// Restore
		// TODO: test rectangle matches original window rectangle
		await page.locator('.window-titlebar').dblclick();
		await expect(page.locator('.window')).not.toHaveCSS('top', '0px');
		await expect(page.locator('.window')).not.toHaveCSS('left', '0px');
		await expect(page.locator('.window')).not.toHaveCSS('width', '300px');
		await expect(page.locator('.window')).not.toHaveCSS('height', '300px');

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
		await expect(page.locator('.window-maximize-button')).toHaveClass(/window-action-maximize/);
		await page.locator('.window-maximize-button').click();
		await expect(page.locator('.window')).toHaveCSS('top', '0px');
		await expect(page.locator('.window')).toHaveCSS('left', '0px');
		// await expect(page.locator('.window')).toHaveCSS('width', '300px'); // see above
		await expect(page.locator('.window')).toHaveCSS('height', '300px');
		await expect(page.locator('.window-maximize-button')).toHaveClass(/window-action-restore/);

		// Restore
		await page.locator('.window-maximize-button').click();
		await expect(page.locator('.window')).not.toHaveCSS('top', '0px');
		await expect(page.locator('.window')).not.toHaveCSS('left', '0px');
		await expect(page.locator('.window')).not.toHaveCSS('width', '300px');
		await expect(page.locator('.window')).not.toHaveCSS('height', '300px');
		await expect(page.locator('.window-maximize-button')).toHaveClass(/window-action-maximize/);
	});

	test('can be closed by clicking the close button', async ({ page }) => {
		await page.evaluate(() => {
			const $window = $Window({
				title: 'Close Me!'
			});
			$window.$content.append('<p>Close me!</p>').css("padding", "30px");
		});
		await page.locator('.window-close-button').click();
		await expect(page.locator('.window')).not.toBeVisible();
	});

	test('can be resized horizontally by dragging the left edge', async ({ page }) => {
		const h$window = await page.evaluateHandle(() => {
			const $window = $Window({
				title: 'Resizable Window',
				resizable: true
			});
			$window.$content.append('<p>Resize me!</p>').css("padding", "30px");
			return $window;
		});
		const originalRect = await h$window.evaluate(($window) =>
			$window.element.getBoundingClientRect()
		);
		// TODO: use https://playwright.dev/docs/api/class-locator#locator-bounding-box
		const leftHandlePos = { x: originalRect.left, y: originalRect.top + originalRect.height / 2 };

		await page.mouse.move(leftHandlePos.x, leftHandlePos.y);
		await page.mouse.down();
		// Try moving in both axes to test that only one direction is allowed
		await page.mouse.move(leftHandlePos.x - 50, leftHandlePos.y);

		const newRect = await h$window.evaluate(($window) =>
			$window.element.getBoundingClientRect()
		);
		expect(newRect.left).toBeLessThan(originalRect.left);

		// `toBeCloseTo` doesn't work like mocha's `to.be.closeTo`  
		// With `to.be.closeTo`, I can specify a range of 1 easily and naturally, very useful for pixel values.  
		// With `toBeCloseTo`, it uses the "number of digits" instead... can I specify a negative "number of decimal digits after the decimal point"?  
		// I can, but `-1` gives a range of `5` instead of `1`...
		// TODO: use `toBeLessThan` and `toBeGreaterThan` for a range of 1 
		expect(newRect.right).toBeCloseTo(originalRect.right, -1);
		expect(newRect.top).toBeCloseTo(originalRect.top, -1);
		expect(newRect.bottom).toBeCloseTo(originalRect.bottom, -1);
		await page.mouse.up();

		// TODO: test corner handles, default clamping, and `options.constrainRect` API clamping
	});

	test.describe('title()', () => {
		test('should set the title of the window', async ({ page }) => {
			const h$window = await page.evaluateHandle(() =>
				$Window({
					title: 'Test Window'
				})
			);
			await expect(page.locator('.window-title')).toHaveText('Test Window');

			await h$window.evaluate(($window) => {
				$window.title('New Title');
			});
			await expect(page.locator('.window-title')).toHaveText('New Title');

			await h$window.evaluate(($window) => {
				// @ts-ignore
				$window.title(420);
			});
			await expect(page.locator('.window-title')).toHaveText('420');
		});
		test('should clear the title if given an empty string', async ({ page }) => {
			const h$window = await page.evaluateHandle(() =>
				$Window({
					title: 'Test Window'
				})
			);
			await expect(page.locator('.window-title')).toHaveText('Test Window');

			await h$window.evaluate(($window) => {
				$window.title('');
			});
			await expect(page.locator('.window-title')).toHaveText('');
		});
		test('should return the current title if called without arguments', async ({ page }) => {
			const title = await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				return $window.title();
			});
			expect(title).toBe('Test Window');
		});
	});

	test.describe('getIconAtSize()', () => {
		test('should return an icon of the requested size', async ({ page }) => {
			const results = await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder'),
						any: new Text('any size placeholder')
					}
				});
				return {
					"$window.getIconAtSize(16)?.textContent": [$window.getIconAtSize(16)?.textContent, '16x16 placeholder'],
					"$window.getIconAtSize(32)?.textContent": [$window.getIconAtSize(32)?.textContent, '32x32 placeholder'],
				};
			});
			for (const [codeSnippet, [actual, expected]] of Object.entries(results)) {
				expect(actual, { message: `Expected ${codeSnippet} to be ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}` }).toBe(expected);
			}
		});
		test('should return an icon of the closest size if none match and no "any" size is provided', async ({ page }) => {
			const results = await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder')
					}
				});
				return {
					"$window.getIconAtSize(0)?.textContent": [$window.getIconAtSize(0)?.textContent, '16x16 placeholder'],
					"$window.getIconAtSize(17)?.textContent": [$window.getIconAtSize(17)?.textContent, '16x16 placeholder'],
					"$window.getIconAtSize(30)?.textContent": [$window.getIconAtSize(30)?.textContent, '32x32 placeholder'],
					"$window.getIconAtSize(300)?.textContent": [$window.getIconAtSize(300)?.textContent, '32x32 placeholder'],
				};
			});
			for (const [codeSnippet, [actual, expected]] of Object.entries(results)) {
				expect(actual, { message: `Expected ${codeSnippet} to be ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}` }).toBe(expected);
			}
		});
		test('should return the "any" size icon if provided and none match exactly', async ({ page }) => {
			const results = await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder'),
						any: new Text('any size placeholder')
					}
				});
				return {
					"$window.getIconAtSize(17)?.textContent": [$window.getIconAtSize(17)?.textContent, 'any size placeholder'],
					"$window.getIconAtSize(30)?.textContent": [$window.getIconAtSize(30)?.textContent, 'any size placeholder'],
					"$window.getIconAtSize(32)?.textContent": [$window.getIconAtSize(32)?.textContent, '32x32 placeholder'],
				};
			});
			for (const [codeSnippet, [actual, expected]] of Object.entries(results)) {
				expect(actual, { message: `Expected ${codeSnippet} to be ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}` }).toBe(expected);
			}
		});
	});

	test.describe('setIcons()', () => {
		test('should set the icons of the window', async ({ page }) => {
			const results = await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				$window.setIcons({
					16: new Text('16x16 placeholder'),
					32: new Text('32x32 placeholder'),
					any: new Text('any size placeholder')
				});
				return {
					"$window.getIconAtSize(16)?.textContent": [$window.getIconAtSize(16)?.textContent, '16x16 placeholder'],
					"$window.getIconAtSize(32)?.textContent": [$window.getIconAtSize(32)?.textContent, '32x32 placeholder'],
					"$window.getIconAtSize(17)?.textContent": [$window.getIconAtSize(17)?.textContent, 'any size placeholder'],
					"$window.getIconAtSize(30)?.textContent": [$window.getIconAtSize(30)?.textContent, 'any size placeholder'],
				};
			});
			for (const [codeSnippet, [actual, expected]] of Object.entries(results)) {
				expect(actual, { message: `Expected ${codeSnippet} to be ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}` }).toBe(expected);
			}

			// It's actually not wrapped in an element, which is a little weird.
			// If you pass it a text node, it's added directly to the titlebar.
			await expect(page.locator('.window').getByText(/16x16 placeholder/).first()).toBeVisible();

		});
		test('should clear the icons if called with an empty object', async ({ page }) => {
			const results = await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window',
					icons: {
						16: new Text('16x16 placeholder'),
						32: new Text('32x32 placeholder'),
						any: new Text('any size placeholder')
					}
				});
				$window.setIcons({});
				return {
					"$window.getIconAtSize(16) == null": [$window.getIconAtSize(16) == null, true],
					"$window.getIconAtSize(32) == null": [$window.getIconAtSize(32) == null, true],
					"$window.getIconAtSize(17) == null": [$window.getIconAtSize(17) == null, true],
					"$window.getIconAtSize(30) == null": [$window.getIconAtSize(30) == null, true],
				};
			});
			for (const [codeSnippet, [actual, expected]] of Object.entries(results)) {
				expect(actual, { message: `Expected ${codeSnippet} to be ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}` }).toBe(expected);
			}
		});
	});

	test.describe('setMenuBar', () => {
		test('should add menu bar, which is hidden when minimized', async ({ page }) => {
			const h$window = await page.evaluateHandle(() => {
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
						}
					],
				});
				$window.setMenuBar(menu);
				return $window;
			});
			await expect(page.locator('[role="menubar"]')).toBeVisible();
			await h$window.evaluate(($window) => {
				$window.minimize();
			});
			await expect(page.locator('.window-titlebar')).toHaveCount(1); // wait for titlebar animation to finish
			// move the window so the menu bar is visible if it's broken
			await page.locator('.window-titlebar').dispatchEvent('pointerdown', { which: 1 });
			await page.locator('.window-titlebar').dispatchEvent('pointermove', { clientX: 150, clientY: 150 });
			await page.locator('.window-titlebar').dispatchEvent('pointerup');
			// In Cypress, `.should('not.be.visible')` was not a strong enough assertion, since it considered offscreen elements hidden.
			await expect(page.locator('[role="menubar"]')).not.toBeVisible();
			// Playwright might not behave the same with `.not.toBeVisible`,
			// but here's a stronger assertion anyway.
			await expect(page.locator('[role="menubar"]')).toHaveCSS('display', 'none');
			await h$window.evaluate(($window) => {
				$window.restore();
			});
			await expect(page.locator('[role="menubar"]')).toBeVisible();
		});
		test('should set up the correct keyboard scope', async ({ page }) => {
			const hTestState = await page.evaluateHandle(() => {
				const testState = { activatedMenuItem: false };
				const $window = $Window({
					title: 'Test Window'
				});
				$window.$content.append('<p>Click in the blank space of the window</p>');
				const menu = new MenuBar({
					"&Test": [
						{
							label: "&Activate Menu Item",
							action: () => {
								testState.activatedMenuItem = true;
							}
						}
					],
				});
				$window.setMenuBar(menu);
				return testState;
			});

			// works while window is focused
			await page.locator('.window-content').click();
			await page.keyboard.press("Alt+T");
			await page.keyboard.press("Enter");
			await expect(await hTestState.evaluate((testState) => testState.activatedMenuItem)).toBe(true);
			hTestState.evaluate((testState) => {
				testState.activatedMenuItem = false;
				// @ts-ignore
				document.activeElement.blur();
			});

			// does nothing while window is not focused
			// await page.locator('body').click(); // using blur() above
			await page.keyboard.press("Alt+T");
			await page.keyboard.press("Enter");
			await expect(await hTestState.evaluate((testState) => testState.activatedMenuItem)).toBe(false);
		});
	});

	test.describe("setDimensions", () => {
		test('should handle various combinations of left/width/right for positioning/sizing', async ({ page }) => {
			const testDataKeys = ["initialLeft", "initialWidth", "initialRight", "paramLeft", "paramWidth", "paramRight", "resultLeft", "resultWidth", "resultRight", "notes"];
			const testData = [
				// https://docs.google.com/spreadsheets/d/1IyTPBGrqFgw16CqB6tlzEDhLv5j56RIAkztt-X4Nrzs/edit?usp=sharing
				// Initial left, Initial width, Initial right, Param left, Param width, Param right, Result left, Result width, Result right, Notes
				// 0 means unset
				[_, _, _, _, _, _, "invalid", "invalid", "invalid",],
				[1, _, _, _, _, _, "invalid", "invalid", "invalid",],
				[_, 1, _, _, _, _, "invalid", "invalid", "invalid",],
				[1, 1, _, _, _, _, "invalid", "invalid", "invalid",],
				[_, _, 1, _, _, _, "invalid", "invalid", "invalid",],
				[1, _, 1, _, _, _, "invalid", "invalid", "invalid",],
				[_, 1, 1, _, _, _, "invalid", "invalid", "invalid",],
				[1, 1, 1, _, _, _, "invalid", "invalid", "invalid",],
				[_, _, _, 2, _, _, 2, _, _,],
				[1, _, _, 2, _, _, 2, _, _,],
				[_, 1, _, 2, _, _, 2, 1, _,],
				[1, 1, _, 2, _, _, 2, 1, _,],
				[_, _, 1, 2, _, _, 2, _, 1,],
				[1, _, 1, 2, _, _, 2, _, 1,],
				[_, 1, 1, 2, _, _, 2, 1, _,],
				[1, 1, 1, 2, _, _, 2, 1, _,],
				[_, _, _, _, 2, _, _, 2, _,],
				[1, _, _, _, 2, _, 1, 2, _,],
				[_, 1, _, _, 2, _, _, 2, _,],
				[1, 1, _, _, 2, _, 1, 2, _,],
				[_, _, 1, _, 2, _, _, 2, 1,],
				[1, _, 1, _, 2, _, 1, 2, _, "Favoring left"],
				[_, 1, 1, _, 2, _, _, 2, 1,],
				[1, 1, 1, _, 2, _, 1, 2, _, "Favoring left"],
				[_, _, _, 2, 2, _, 2, 2, _,],
				[1, _, _, 2, 2, _, 2, 2, _,],
				[_, 1, _, 2, 2, _, 2, 2, _,],
				[1, 1, _, 2, 2, _, 2, 2, _,],
				[_, _, 1, 2, 2, _, 2, 2, _,],
				[1, _, 1, 2, 2, _, 2, 2, _,],
				[_, 1, 1, 2, 2, _, 2, 2, _,],
				[1, 1, 1, 2, 2, _, 2, 2, _,],
				[_, _, _, _, _, 2, _, _, 2,],
				[1, _, _, _, _, 2, 1, _, 2,],
				[_, 1, _, _, _, 2, _, 1, 2,],
				[1, 1, _, _, _, 2, _, 1, 2,],
				[_, _, 1, _, _, 2, _, _, 2,],
				[1, _, 1, _, _, 2, 1, _, 2,],
				[_, 1, 1, _, _, 2, _, 1, 2,],
				[1, 1, 1, _, _, 2, _, 1, 2,],
				[_, _, _, 2, _, 2, 2, _, 2,],
				[1, _, _, 2, _, 2, 2, _, 2,],
				[_, 1, _, 2, _, 2, 2, _, 2,],
				[1, 1, _, 2, _, 2, 2, _, 2,],
				[_, _, 1, 2, _, 2, 2, _, 2,],
				[1, _, 1, 2, _, 2, 2, _, 2,],
				[_, 1, 1, 2, _, 2, 2, _, 2,],
				[1, 1, 1, 2, _, 2, 2, _, 2,],
				[_, _, _, _, 2, 2, _, 2, 2,],
				[1, _, _, _, 2, 2, _, 2, 2,],
				[_, 1, _, _, 2, 2, _, 2, 2,],
				[1, 1, _, _, 2, 2, _, 2, 2,],
				[_, _, 1, _, 2, 2, _, 2, 2,],
				[1, _, 1, _, 2, 2, _, 2, 2,],
				[_, 1, 1, _, 2, 2, _, 2, 2,],
				[1, 1, 1, _, 2, 2, _, 2, 2,],
				[_, _, _, 2, 2, 2, "invalid", "invalid", "invalid",],
				[1, _, _, 2, 2, 2, "invalid", "invalid", "invalid",],
				[_, 1, _, 2, 2, 2, "invalid", "invalid", "invalid",],
				[1, 1, _, 2, 2, 2, "invalid", "invalid", "invalid",],
				[_, _, 1, 2, 2, 2, "invalid", "invalid", "invalid",],
				[1, _, 1, 2, 2, 2, "invalid", "invalid", "invalid",],
				[_, 1, 1, 2, 2, 2, "invalid", "invalid", "invalid",],
				[1, 1, 1, 2, 2, 2, "invalid", "invalid", "invalid",],
			];
			const h$window = await page.evaluateHandle(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				// $window.setDimensions({
				return $window;
			});
			await expect(page.locator('.window')).toHaveCSS('width', '400px');
			await expect(page.locator('.window')).toHaveCSS('height', '300px');
		});
		test('should be limited by minimum inner width and height options', async ({ page }) => {
			const h$window = await page.evaluateHandle(() => {
				const $window = $Window({
					title: 'Test Window',
					minInnerWidth: 200,
					minInnerHeight: 150,
				});
				$window.setDimensions({ innerWidth: 2000, innerHeight: 1500 });
				return $window;
			});
			await expect(page.locator('.window-content')).toHaveCSS('width', '2000px');
			await expect(page.locator('.window-content')).toHaveCSS('height', '1500px');
			await h$window.evaluate(($window) => {
				$window.setDimensions({ innerWidth: 100, innerHeight: 100 });
			});
			await expect(page.locator('.window-content')).toHaveCSS('width', '200px');
			await expect(page.locator('.window-content')).toHaveCSS('height', '150px');
		});
		test('should be limited by minimum outer width and height options', async ({ page }) => {
			const h$window = await page.evaluateHandle(() => {
				const $window = $Window({
					title: 'Test Window',
					minOuterWidth: 200,
					minOuterHeight: 150,
				});
				$window.setDimensions({ outerWidth: 2000, outerHeight: 1500 });
				return $window;
			});
			await expect(page.locator('.window')).toHaveCSS('width', '2000px');
			await expect(page.locator('.window')).toHaveCSS('height', '1500px');
			await h$window.evaluate(($window) => {
				$window.setDimensions({ outerWidth: 100, outerHeight: 100 });
			});
			await expect(page.locator('.window')).toHaveCSS('width', '200px');
			await expect(page.locator('.window')).toHaveCSS('height', '150px');
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
			await expect(page.locator('.window')).not.toBeFocused();
			await page.locator('.window-content').click();
			await expect(page.locator('.window-content')).toBeFocused();
		});
		test("should focus the window when clicking on the title bar", async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				$window.$content.append('<p>Click on the title bar</p>');
			});
			await expect(page.locator('.window')).not.toBeFocused();
			await page.locator('.window-titlebar').click();
			await expect(page.locator('.window-content')).toBeFocused();
		});
		test("should focus a control in the window when clicking it", async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				$window.$content.append('<form><input type="text" id="input" value="Click me"><textarea id="textarea">Text area</textarea></form>');

				document.body.style.minHeight = "10px"; // avoid failing to click on "invisible" body
			});
			await expect(page.locator('#input')).not.toBeFocused();
			await page.locator('#input').click();
			await expect(page.locator('#input')).toBeFocused();
			await page.locator('body').click();
			await expect(page.locator('#input')).not.toBeFocused();
			// await expect(page.locator(':focus')).toMatchLocator???(page.locator('body')); // trying to get it to say what is focused if it fails
			await expect(page.locator('body')).toBeFocused();
			// refocusing logic should not override clicking a specific control
			await page.locator('#textarea').click();
			await expect(page.locator('#textarea')).toBeFocused();
		});
		test("should focus the last focused control in the window when clicking a disabled control", async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Test Window'
				});
				$window.$content.append('<button id="disabled-button" disabled>Can\'t click me</button><button id="enabled-button">Click me</button>');

				document.body.style.minHeight = "10px"; // avoid failing to click on "invisible" body
			});
			// await page.locator('#disabled-button').click({ force: true });
			await page.locator('#disabled-button').dispatchEvent('pointerdown', { which: 1 });
			// await expect(page.locator('.window-content')).toBeFocused();
			// expect(page.locator(':focus')).toMatchLocator???(page.locator('.window-content'));
			// await expect(page.locator(':focus')).toHaveClass('window-content'); // finally a way for it to tell me the active element on failure... but not as general as I would like
			// Actually, the first enabled control should be focused.
			// await expect(page.locator(':focus')).toHaveId('enabled-button');
			// Really, they should just improve the reporting for toBeFocused,
			// so I'm going to keep my code canonical.
			await expect(page.locator('#enabled-button')).toBeFocused();
			await page.locator('#enabled-button').click();
			await expect(page.locator('#enabled-button')).toBeFocused();
			// await page.locator('#disabled-button').click({ force: true });
			await page.locator('#disabled-button').dispatchEvent('pointerdown', { which: 1 });
			await expect(page.locator('#enabled-button')).toBeFocused();
			await page.locator('body').click();
			await expect(page.locator('body')).toBeFocused();
			// expect(page.locator(':focus')).toMatchLocator???(page.locator('body'));
			// await page.locator('#disabled-button').click({ force: true });
			await page.locator('#disabled-button').dispatchEvent('pointerdown', { which: 1 });
			await expect(page.locator('#enabled-button')).toBeFocused();
		});
		test("should focus the last focused control in the window when closing another window that was focused", async ({ page }) => {
			await page.evaluate(() => {
				const $window = $Window({
					title: 'Original Window'
				});
				$window.$content.append('<p>Window originally having focus <textarea id="textarea">Text area</textarea></p>');
			});
			await page.locator('#textarea').focus();
			await expect(page.locator('#textarea')).toBeFocused();
			await page.evaluate(() => {
				const $window2 = $Window({
					title: 'Popup Window'
				});
				$window2.$content.append('<p>Window taking focus temporarily</p><p><button id="close-popup">Close</button></p>');
			});
			await page.locator('#close-popup').focus();
			await expect(page.locator('#close-popup')).toBeFocused();
			await page.locator('.window-close-button').last().click();
			await expect(page.locator('#textarea')).toBeFocused();
			// expect(page.locator(':focus')).toMatchLocator???(page.locator('textarea'));
		});
		// test.describe("tabstop wrapping", () => {
		// SEE tests/tabstop-wrapping.spec.ts
		// });
	});
});