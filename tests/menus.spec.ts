// import { Locator, test as baseTest, expect } from '@playwright/test';
import { Page, expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';

// Notes:
// 1. The `.not.toBeVisible()` matcher may cause problems in the future if I make it remove the element from the DOM when it's closed.
// 2. Not idiomatic Playwright code. Converted from Cypress, could use some cleanup.

// TODO: make this a fixture?
function getMenuPopup(page: Page, menuName: string) {
	return page.getByRole('menu').and(page.getByLabel(menuName));
}
// type MyFixtures = {
// 	getMenuPopup: (menuName: string) => Promise<Locator???>;
// };
// export const test = baseTest.extend<MyFixtures>({
// 	getMenuPopup: async ({ page }, use) => {
// 		await use(async (menuName: string) => {
// 			return page.getByRole('menu').and(page.getByLabel(menuName));
// 		});
// 	},
// });

test.describe('MenuBar Component', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 300, height: 300 });
		const filePath = __dirname + '/../cypress/fixtures/menu-bar-test-page.html';
		await page.goto(pathToFileURL(filePath).href);
	});

	test('should load the menu bar', async ({ page }) => {
		await expect(page.getByRole('menubar')).toBeVisible();
	});

	test('should open/close menu on click', async ({ page }) => {
		await page.getByRole('menuitem', { name: 'File' }).click();
		await expect(getMenuPopup(page, 'File')).toBeVisible();
		await page.getByRole('menuitem', { name: 'File' }).click();
		await expect(getMenuPopup(page, 'File')).not.toBeVisible(); // see NOTE 1
	});

	test('should close menu when clicking outside', async ({ page }) => {
		await page.getByRole('menuitem', { name: 'File' }).click();
		await expect(getMenuPopup(page, 'File')).toBeVisible();
		await page.locator('body').click();
		await expect(getMenuPopup(page, 'File')).not.toBeVisible(); // see NOTE 1
	});

	test('should glide through menus (open menu on hover while another menu is open)', async ({ page }) => {
		// See NOTE 2
		await page.locator('.menu-button').first().dispatchEvent('pointerdown');
		await expect(page.locator('.menu-popup:visible')).toContainText('Open');
		await page.locator('.menu-button').nth(1).dispatchEvent('pointermove'); // I wonder if there's a reason it doesn't use pointerenter
		await expect(page.locator('.menu-popup:visible')).toContainText('Checkbox State');
		// It should stay in gliding state even after the mouse button is released
		await page.locator('.menu-button').nth(1).dispatchEvent('pointerup');
		await expect(page.locator('.menu-popup:visible')).toContainText('Checkbox State'); // (should stay open btw)
		await page.locator('.menu-button').nth(2).dispatchEvent('pointermove');
		await expect(page.locator('.menu-popup:visible')).toContainText('Copy');
	});
});
