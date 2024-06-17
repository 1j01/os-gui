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
		const winHandle = await page.evaluateHandle(() => window);
		const $window = await winHandle.evaluate((win) => win.$Window({
			title: 'Test Window',
			maximizeButton: true,
			minimizeButton: true,
			closeButton: true,
		}));
		await $window.evaluate((w) => w.minimize());
		await expect(page.locator('.window')).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window')).toHaveCSS('left', '10px');

		const $window2 = await winHandle.evaluate((win) => win.$Window({
			title: 'Test Window 2',
			minimizeButton: true,
		}));
		await $window2.evaluate((w) => w.minimize());
		await expect(page.locator('.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window').last()).toHaveCSS('left', '170px');

		const $window3 = await winHandle.evaluate((win) => {
			win.$Window({
				title: 'Test Window 3',
				minimizeButton: true,
			});
			win.$Window.close();
			return win.$Window({
				title: 'Test Window 3',
				minimizeButton: true,
			});
		});
		await $window3.evaluate((w) => w.minimize());
		await expect(page.locator('.window')).toHaveCount(2);
		await expect(page.locator('.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window').last()).toHaveCSS('left', '10px');
	});

	test('can be minimized/restored by clicking the minimize button', async ({ page }) => {
		const winHandle = await page.evaluateHandle(() => window);
		const $window = await winHandle.evaluate((win) => win.$Window({
			title: 'Test Window',
			maximizeButton: true,
			minimizeButton: true,
			closeButton: true,
		}));
		await page.click('.window-minimize-button');
		await expect(page.locator('.window')).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window')).toHaveCSS('left', '10px');

		await winHandle.evaluate((win) => win.$Window({
			title: 'Test Window 2',
			minimizeButton: true,
		}));
		await page.click('.window-minimize-button >> nth=1');
		await expect(page.locator('.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window').last()).toHaveCSS('left', '170px');

		await $window.evaluate((w) => w.restore());
		await expect(page.locator('.window')).toHaveCount(3);
		await page.click('.window-minimize-button >> nth=2');
		await expect(page.locator('.window').last()).toHaveCSS('bottom', '-3px');
		await expect(page.locator('.window').last()).toHaveCSS('left', '10px');
	});

	test('can be dragged by the title bar', async ({ page }) => {
		const winHandle = await page.evaluateHandle(() => window);
		const $window = await winHandle.evaluate((win) => win.$Window({
			title: 'Test Window',
			maximizeButton: true,
			minimizeButton: true,
			closeButton: true,
		}));
		await $window.evaluate((w) => {
			w.$content.append('<p>Drag me!</p>').css("padding", "30px");
		});
		const box = await page.locator('.window-titlebar').boundingBox();
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(box.x, box.y);
		await expect(page.locator('.window')).toHaveCSS('left', new RegExp('^-?\\d+px$'));
		await expect(page.locator('.window')).toHaveCSS('top', new RegExp('^-?\\d+px$'));
		await page.mouse.up();
		await expect(page.locator('.window')).toHaveCSS('top', '0px');
	});

	test('can be maximized/restored by double-clicking the title bar (and cannot be dragged while maximized)', async ({ page }) => {
		const winHandle = await page.evaluateHandle(() => window);
		const $window = await winHandle.evaluate((win) => win.$Window({
			title: 'Double Click Me!',
			maximizeButton: true,
			minimizeButton: true,
			closeButton: true,
			resizable: true,
		}));
		await $window.evaluate((w) => {
			w.$content.append('<p>Titlebar double click maximization test window</p>').css("padding", "30px");
		});
		await page.dblclick('.window-titlebar');
		await expect(page.locator('.window')).toHaveCSS('top', '0px');
		await expect(page.locator('.window')).toHaveCSS('left', '0px');
		await expect(page.locator('.window')).toHaveCSS('height', '300px');

		const box = await page.locator('.window-titlebar').boundingBox();
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(box.x + 50, box.y + 50);
		await expect(page.locator('.window')).toHaveCSS('top', '0px');
		await expect(page.locator('.window')).toHaveCSS('left', '0px');
		await expect(page.locator('.window')).toHaveCSS('height', '300px');

		await page.dblclick('.window-titlebar');
		await expect(page.locator('.window')).not.toHaveCSS('top', '0px');
		await expect(page.locator('.window')).not.toHaveCSS('left', '0px');
		await expect(page.locator('.window')).not.toHaveCSS('width', '300px');
		await expect(page.locator('.window')).not.toHaveCSS('height', '300px');
	});

	test('can be maximized/restored by clicking the maximize button', async ({ page }) => {
		const winHandle = await page.evaluateHandle(() => window);
		const $window = await winHandle.evaluate((win) => win.$Window({
			title: 'Maximize Me!',
			maximizeButton: true,
			minimizeButton: true,
			closeButton: true,
			resizable: true,
		}));
		await $window.evaluate((w) => {
			w.$content.append('<p>Maximize button test window</p>').css("padding", "30px");
		});
		await expect(page.locator('.window-maximize-button')).toHaveClass(/window-action-maximize/);
		await page.click('.window-maximize-button');
		await expect(page.locator('.window')).toHaveCSS('top', '0px');
		await expect(page.locator('.window')).toHaveCSS('left', '0px');
		await expect(page.locator('.window')).toHaveCSS('height', '300px');
		await expect(page.locator('.window-maximize-button')).toHaveClass(/window-action-restore/);

		await page.click('.window-maximize-button');
		await expect(page.locator('.window')).not.toHaveCSS('top', '0px');
		await expect(page.locator('.window')).not.toHaveCSS('left', '0px');
		await expect(page.locator('.window')).not.toHaveCSS('width', '300px');
		await expect(page.locator('.window')).not.toHaveCSS('height', '300px');
		await expect(page.locator('.window-maximize-button')).toHaveClass(/window-action-maximize/);
	});

	test('can be closed by clicking the close button', async ({ page }) => {
		const winHandle = await page.evaluateHandle(() => window);
		const $window = await winHandle.evaluate((win) => win.$Window({
			title: 'Close Me!',
		}));
		await $window.evaluate((w) => {
			w.$content.append('<p>Close me!</p>').css("padding", "30px");
		});
		await page.click('.window-close-button');
		await expect(page.locator('.window')).not.toBeVisible();
	});

	test('can be resized horizontally by dragging the left edge', async ({ page }) => {
		const winHandle = await page.evaluateHandle(() => window);
		const $window = await winHandle.evaluate((win) => win.$Window({
			title: 'Resizable Window',
			resizable: true,
		}));
		await $window.evaluate((w) => {
			w.$content.append('<p>Resize me!</p>').css("padding", "30px");
		});
		const box = await page.locator('.window-resizer-left').boundingBox();
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.down();
		await page.mouse.move(box.x - 50, box.y);
		await page.mouse.up();
		await expect(page.locator('.window')).toHaveCSS('width', new RegExp('^-?\\d+px$'));
	});
});
