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

// This only exists within the test page, i.e. page.evaluate,
// but I doubt there's a good way to say something exists within page.evaluate calls only.
declare const testState: {
	fileOpenTriggered: boolean;
	checkboxState: boolean;
	disabledActionTriggered: boolean;
};

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


	test('should open menus and activate menu items with access keys', async ({ page }) => {
		await page.locator('body').press('Alt+KeyF');
		await expect(page.locator('.menu-button').first()).toHaveAttribute('aria-expanded', 'true');
		// Menu item with action
		await expect(await page.evaluate(() => testState.fileOpenTriggered)).toBe(false);
		await page.locator('body').press('KeyO');
		await expect(await page.evaluate(() => testState.fileOpenTriggered)).toBe(true);
		// Menu should be closed after action is triggered
		await expect(page.locator('.menu-button').first()).toHaveAttribute('aria-expanded', 'false');
		await expect(page.locator('.menu-button').nth(1)).toHaveAttribute('aria-expanded', 'false');
		// Checkbox menu item
		await page.locator('body').press('Alt+KeyV');
		await expect(page.locator('.menu-button').nth(1)).toHaveAttribute('aria-expanded', 'true');
		await expect(await page.evaluate(() => testState.checkboxState)).toBe(false);
		await expect(page.getByRole('menuitemcheckbox', { name: 'Checkbox State' }).first()).toHaveAttribute('aria-checked', 'false');
		await page.locator('body').press('KeyS');
		await expect(await page.evaluate(() => testState.checkboxState)).toBe(true);
		await expect(page.getByRole('menuitemcheckbox', { name: 'Checkbox State' }).first()).toHaveAttribute('aria-checked', 'true');
		// Menu should be closed after checkbox is toggled
		// TODO: match Windows behavior
		// await expect(page.locator('.menu-button').first()).toHaveAttribute('aria-expanded', 'false');
		// await expect(page.locator('.menu-button').nth(1)).toHaveAttribute('aria-expanded', 'false');
		await page.locator('body').press('Escape');
		// Submenu item
		await page.locator('body').press('Alt+KeyV');
		await page.locator('body').press('KeyM')
		// Should cycle through items with ambiguous access keys,
		// including menu items without defined access keys, which use the first letter of the label.
		// TODO: make sure both implicit and explicit access keys are tested
		// TODO: test that the items are not activated, only highlighted
		await expect(page.locator('.menu-item.highlight:has-text("Item 0")')).toBeVisible();
		await page.locator('body').press('KeyI');
		await expect(page.locator('.menu-item.highlight:has-text("Item 1")')).toBeVisible();
		await page.locator('body').press('KeyI');
		await expect(page.locator('.menu-item.highlight:has-text("Item 2")')).toBeVisible();
		// Should cycle back to the first item
		await page.locator('body').pressSequentially(Array(100 - 2).fill('i').join(''));
		await expect(page.locator('.menu-item.highlight:has-text("Item 0")')).toBeVisible();

		// TODO: test also ambiguous top level menu access keys (would be really bad practice, but should probably still be supported)
	});

	// TODO: rework or remove this test
	// test radio buttons have role "menuitemradio" specifically etc.
	// probably by just writing a test for the radio menu items
	test.skip('should have correct ARIA attributes', async ({ page }) => {
		await page.getByText('File').click();
		await expect(page.locator('.menu-button, .menu-item')).toHaveAttribute('role', /^(menuitem|menuitemcheckbox|menuitemradio)$/);
		await expect(page.locator('.menu-popup')).toHaveAttribute('role', 'menu');
	});

	test('should open/close submenu on hover', async ({ page }) => {
		await page.locator('.menu-button').nth(1).click();
		const menuItem = page.locator('.menu-popup .menu-item[aria-haspopup="true"]').first();
		const nextMenuItem = page.locator('.menu-popup .menu-item[aria-haspopup="true"] + .menu-item').first();
		await menuItem.hover();
		await expect(menuItem).toHaveAttribute('aria-expanded', 'true');
		await nextMenuItem.hover();
		await expect(menuItem).toHaveAttribute('aria-expanded', 'false');
	});

	test('should navigate menus using arrow keys', async ({ page }) => {
		// moving between items in the same menu
		await page.locator('.menu-button').first().click();
		await page.locator(':focus').press('ArrowDown');
		await expect(page.locator('.menu-item:visible').first()).toHaveClass(/\bhighlight\b/);
		await page.locator(':focus').press('ArrowDown');
		await expect(page.locator('.menu-item:visible').nth(1)).toHaveClass(/\bhighlight\b/);
		await page.locator(':focus').press('ArrowUp');
		await expect(page.locator('.menu-item:visible').first()).toHaveClass(/\bhighlight\b/);
		// wrapping around within a menu
		await page.locator(':focus').press('ArrowUp');
		await expect(page.locator('.menu-item:visible').last()).toHaveClass(/\bhighlight\b/);
		await page.locator(':focus').press('ArrowDown');
		await expect(page.locator('.menu-item:visible').first()).toHaveClass(/\bhighlight\b/);
		// moving between top level menus while open
		// File menu should be open
		await expect(page.locator('.menu-button').first()).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('.menu-popup:visible')).toContainText('Open');
		await page.locator(':focus').press('ArrowRight');
		// View menu should be open
		await expect(page.locator('.menu-button').nth(1)).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('.menu-popup:visible')).toContainText('Checkbox State');
		await page.locator(':focus').press('ArrowLeft');
		// File menu should be open
		await expect(page.locator('.menu-button').first()).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('.menu-popup:visible')).toContainText('Open');
		await page.locator(':focus').press('ArrowLeft');
		// expect( await page.locator('.menu-popup:visible')).toContainText('Maximize'); // App menu (alt+space menu) would only apply if inside a window, and isn't implemented as of writing
		// Edit menu should be open, wrapping around
		await expect(page.locator('.menu-button').last()).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('.menu-popup:visible')).toContainText('Copy');
		await page.locator(':focus').press('ArrowRight');
		// File menu should be open, wrapping around
		await expect(page.locator('.menu-button').first()).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('.menu-popup:visible')).toContainText('Open');
		// moving between top level menu buttons without opening menus (after pressing Escape)
		await page.locator('body').press('Escape');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(0);
		await expect(page.locator('.menu-button').first()).toBeFocused();
		await expect(page.locator('.menu-button').first()).toHaveAttribute('aria-expanded', 'false');
		await page.locator(':focus').press('ArrowRight');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(0);
		await expect(page.locator('.menu-button').nth(1)).toBeFocused();
		await expect(page.locator('.menu-button').nth(1)).toHaveAttribute('aria-expanded', 'false');
		await page.locator(':focus').press('ArrowDown');
		// opening menu from this state by pressing down arrow
		await expect(page.locator('.menu-popup:visible')).toHaveCount(1);
		await expect(page.locator('.menu-item:visible').first()).toHaveClass(/\bhighlight\b/);
		// or up arrow (and yes, it should still be the first item, to match Windows 98's behavior)
		await page.locator('body').press('Escape');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(0);
		await page.locator(':focus').press('ArrowUp');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(1);
		await expect(page.locator('.menu-item:visible').first()).toHaveClass(/\bhighlight\b/);
	});

	test('should enter/exit submenus using arrow keys', async ({ page }) => {
		// test entering/exiting submenus with right/left
		await page.locator('.menu-button').nth(1).click();
		await page.locator(':focus').press('ArrowDown');
		await page.locator(':focus').press('ArrowDown');
		const menuItemWithSubmenu = await page.locator('.menu-popup:visible .menu-item[aria-haspopup="true"]').first();
		await expect(menuItemWithSubmenu).toHaveClass(/\bhighlight\b/)
		await expect(menuItemWithSubmenu).toHaveAttribute('aria-expanded', 'false');
		await page.locator(':focus').press('ArrowRight');
		await expect(menuItemWithSubmenu).toHaveClass(/\bhighlight\b/)
		await expect(menuItemWithSubmenu).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(2);
		await page.locator(':focus').press('ArrowLeft');
		await expect(menuItemWithSubmenu).toHaveClass(/\bhighlight\b/)
		await expect(menuItemWithSubmenu).toHaveAttribute('aria-expanded', 'false');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(1);
		// test reversed left/right interaction in RTL layout
		await page.locator(':focus').press('Escape');
		await page.evaluate(() => {
			document.body.style.direction = 'rtl';
		});
		await page.locator('.menu-button').nth(1).click();
		await page.locator(':focus').press('ArrowDown');
		await page.locator(':focus').press('ArrowDown');
		await expect(menuItemWithSubmenu).toHaveClass(/\bhighlight\b/)
		await expect(menuItemWithSubmenu).toHaveAttribute('aria-expanded', 'false');
		await page.locator(':focus').press('ArrowLeft');
		await expect(menuItemWithSubmenu).toHaveClass(/\bhighlight\b/)
		await expect(menuItemWithSubmenu).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(2);
		await page.locator(':focus').press('ArrowRight');
		await expect(menuItemWithSubmenu).toHaveClass(/\bhighlight\b/)
		await expect(menuItemWithSubmenu).toHaveAttribute('aria-expanded', 'false');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(1);

		// TODO: test moving to adjacent menu if pressing in the direction opposite the submenu indicator arrow
	});

	test.skip('should (maybe) jump to first/last item using home/end keys (not actually supported in Windows)', async ({ page }) => {
		await page.locator('.menu-button').first().click();
		await page.locator(':focus').press('End');
		await expect(page.locator('.menu-item').last()).toHaveClass(/\bhighlight\b/);
		await page.locator(':focus').press('Home');
		await expect(page.locator('.menu-item').first()).toHaveClass(/\bhighlight\b/);
	});

	// TODO: disable interacting with disabled items
	test.skip('should not interact with disabled menu items', async ({ page }) => {
		await page.locator('.menu-button').last().click();
		await page.locator('.menu-item[aria-disabled="true"]').click();
		await expect(page.locator('.menu-popup')).toBeVisible(); // Still open because the disabled item didn't trigger close
		await expect(await page.evaluate(() => testState.disabledActionTriggered)).toBe(false);
	});


	test('should trigger action on menu item click', async ({ page }) => {
		await expect(await page.evaluate(() => testState.fileOpenTriggered)).toBe(false);
		await page.locator('.menu-button').first().click();
		await page.locator('.menu-popup .menu-item').first().click();
		await expect(await page.evaluate(() => testState.fileOpenTriggered)).toBe(true);
	});

	test('should trigger action when pressing enter', async ({ page }) => {
		await page.locator('body').press('Alt+KeyF');
		await expect(page.locator('.menu-popup:visible .menu-item').first()).toHaveClass(/\bhighlight\b/);
		await expect(page.locator('.menu-popup:visible').first()).toBeFocused();
		await expect(await page.evaluate(() => testState.fileOpenTriggered)).toBe(false);
		await page.locator(':focus').press('Enter');
		await expect(await page.evaluate(() => testState.fileOpenTriggered)).toBe(true);
	});

	test('should do nothing when pressing space', async ({ page }) => {
		await page.locator('body').press('Alt+KeyF');
		await expect(page.locator('.menu-popup:visible .menu-item').first()).toHaveClass(/\bhighlight\b/);
		await expect(page.locator('.menu-popup:visible').first()).toBeFocused();
		await expect(await page.evaluate(() => testState.fileOpenTriggered)).toBe(false);
		await page.locator('.menu-popup:focus').press('Space');
		await expect(await page.evaluate(() => testState.fileOpenTriggered)).toBe(false);
	});

	test('should exit one menu level when pressing Escape', async ({ page }) => {
		await page.locator('.menu-button').first().click();
		await expect(page.locator('.menu-popup:visible')).toHaveCount(1);
		await page.locator('body').press('Escape');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(0);
		// test with submenu
		await page.locator('.menu-button').nth(1).click();
		await page.locator('.menu-popup .menu-item[aria-haspopup="true"]').first().click();
		await expect(page.locator('.menu-popup:visible')).toHaveCount(2);
		await page.locator('body').press('Escape');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(1);
		await page.locator('body').press('Escape');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(0);
	});

	test('should close all menus when pressing Alt, and refocus the last focused control outside the menu bar', async ({ page }) => {
		page.evaluate(() => {
			const button = document.createElement('button');
			button.id = 'focusable';
			document.body.appendChild(button);
			button.focus();
			button.textContent = 'Focus';
		});
		await expect(page.locator('#focusable')).toBeFocused();

		await page.locator('.menu-button').first().click();
		await expect(page.locator('.menu-popup:visible')).toHaveCount(1);
		await expect(page.locator('#focusable')).not.toBeFocused();
		await page.locator('body').press('Alt');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(0);
		await expect(page.locator('#focusable')).toBeFocused();
		// test with submenu
		await page.locator('.menu-button').nth(1).click();
		await page.locator('.menu-popup .menu-item[aria-haspopup="true"]').first().click();
		await expect(page.locator('.menu-popup:visible')).toHaveCount(2);
		await page.locator('body').press('Alt');
		await expect(page.locator('.menu-popup:visible')).toHaveCount(0);
		await expect(page.locator('#focusable')).toBeFocused();
	});
});
