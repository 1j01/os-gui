import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';

test.describe('tabstop wrapping', () => {
	// TODO: test `<label>` surrounding or not surrounding `<input>` (do labels even factor in to tabstop wrapping?)
	// test hidden controls, disabled controls
	// test other controls from kitchen sink manual tests (test.js)
	test('should wrap around and focus the first/last control in the window when tabbing/shift+tabbing', async ({ page }) => {
		await page.setViewportSize({ width: 300, height: 300 });

		const filePath = 'cypress/fixtures/window-test-page.html';
		await page.goto(pathToFileURL(filePath).href);

		await page.evaluate(() => {
			const $window = $Window({
				title: 'Tabstop Wrapping',
			});
			$window.$content.append(`
				<p>Tabstop wrapping test</p>
				<button id="button1">Button 1</button>
				<button id="button2">Button 2</button>
				<button id="button3">Button 3</button>
			`);
		});

		await page.focus('#button1');
		await expect(page.locator('#button1')).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.locator('#button2')).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.locator('#button3')).toBeFocused();

		// Wrap around
		await page.keyboard.press('Tab');
		await expect(page.locator('#button1')).toBeFocused();

		// Shift+Tab, wrap around backwards
		await page.keyboard.down('Shift');
		await page.keyboard.press('Tab');
		await page.keyboard.up('Shift');
		await expect(page.locator('#button3')).toBeFocused();

		await page.keyboard.down('Shift');
		await page.keyboard.press('Tab');
		await page.keyboard.up('Shift');
		await expect(page.locator('#button2')).toBeFocused();
	});
});
