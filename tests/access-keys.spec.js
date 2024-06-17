import { expect, test } from '@playwright/test';
const { AccessKeys } = require('../MenuBar');

test.describe('AccessKeys', () => {
	test.describe('escape', () => {
		test('should escape a stranded ampersand', () => {
			expect(AccessKeys.escape('Save & Exit')).toBe('Save && Exit');
		});

		test('should escape multiple ampersands', () => {
			expect(AccessKeys.escape('Save & Exit & Reload')).toBe('Save && Exit && Reload');
		});

		test('should escape adjacent ampersands', () => {
			expect(AccessKeys.escape('Save && Exit')).toBe('Save &&&& Exit');
		});

		test('should escape embedded ampersands', () => {
			expect(AccessKeys.escape('Foo&bar baz&quux')).toBe('Foo&&bar baz&&quux');
		});

	});

	test.describe('unescape', () => {
		test('should unescape double ampersands', () => {
			expect(AccessKeys.unescape('Save && Exit')).toBe('Save & Exit');
		});

		test('should not alter single ampersands', () => {
			expect(AccessKeys.unescape('Save & Exit')).toBe('Save & Exit');
		});

		test('should unescape multiple double ampersands', () => {
			expect(AccessKeys.unescape('Save && Exit && Reload')).toBe('Save & Exit & Reload');
		});

		test('should unescape triple ampersands (partially) I suppose', () => {
			expect(AccessKeys.unescape('Invalid &&& Access Key')).toBe('Invalid && Access Key');
		});

		test('should unescape quadruple ampersands', () => {
			expect(AccessKeys.unescape('true &&&& false')).toBe('true && false');
		});
	});

	test.describe('has', () => {
		test('should return true if label has an access key', () => {
			expect(AccessKeys.has('&Save')).toBe(true);
		});

		test('should return false if label does not have an access key', () => {
			expect(AccessKeys.has('Save')).toBe(false);
		});

		test('should return false if label is just an ampersand', () => {
			expect(AccessKeys.has('&')).toBe(false);
		});

		test('should return false if label has a stranded ampersand', () => {
			expect(AccessKeys.has('Save & Exit')).toBe(false);
		});

		test('should return true if label has a parenthetical and numeric access key', () => {
			expect(AccessKeys.has('First (&1)')).toBe(true);
		});
	});

	test.describe('get', () => {
		test('should return the access key from the label', () => {
			expect(AccessKeys.get('&Save')).toBe('S');
		});

		test('should return the first access key if there appear to be multiple', () => {
			expect(AccessKeys.get('&Save &It')).toBe('S');
		});

		test('should return null if there is no access key', () => {
			expect(AccessKeys.get('Save')).toBe(null);
		});

		test('should return null if label is just an ampersand', () => {
			expect(AccessKeys.get('&')).toBe(null);
		});

		test('should return null if label is just an escaped ampersand', () => {
			expect(AccessKeys.get('&&')).toBe(null);
		});

		test('should return null if label has a stranded ampersand', () => {
			expect(AccessKeys.get('Save & Exit')).toBe(null);
		});

		test('should return the parenthetical access key', () => {
			expect(AccessKeys.get('새로 만들기 (&N)')).toBe('N');
		});
	});

	test.describe('remove', () => {
		test('should remove access key ampersand', () => {
			expect(AccessKeys.remove('E&xit')).toBe('Exit');
		});

		test('should remove access key parentheticals', () => {
			expect(AccessKeys.remove('새로 만들기 (&N)')).toBe('새로 만들기');
		});

		test('should preserve unmarked parentheticals', () => {
			expect(AccessKeys.remove('Foo (F) Bar (B)')).toBe('Foo (F) Bar (B)');
		});

		test('should preserve multi-character parentheticals', () => {
			expect(AccessKeys.remove('Set As Wallpaper (&Tiled)')).toBe('Set As Wallpaper (Tiled)');
		});

		test('should leave labels with no access key as-is', () => {
			expect(AccessKeys.remove('Boring Item')).toBe('Boring Item');
		});

		test('should un-escape double ampersands', () => {
			expect(AccessKeys.remove('Foo && Bar&&Baz')).toBe('Foo & Bar&Baz');
		});

		test('should only remove one access key ampersand (the one actually treated as an access key)', () => {
			expect(AccessKeys.remove('&Foo, &Bar, &Baz')).toBe('Foo, &Bar, &Baz');
		});

		test('should preserve a parenthetical with an ampersand, unescaping it', () => {
			expect(AccessKeys.remove('I like ampersands (&&)')).toBe('I like ampersands (&)');
		});
	});

	test.describe('toText', () => {
		test('should remove access key ampersand', () => {
			expect(AccessKeys.toText('E&xit')).toBe('Exit');
		});

		test('should preserve access key parentheticals', () => {
			expect(AccessKeys.toText('새로 만들기 (&N)')).toBe('새로 만들기 (N)');
		});

		test('should preserve unmarked parentheticals', () => {
			expect(AccessKeys.toText('Foo (F) Bar (B)')).toBe('Foo (F) Bar (B)');
		});

		test('should preserve multi-character parentheticals', () => {
			expect(AccessKeys.toText('Set As Wallpaper (&Tiled)')).toBe('Set As Wallpaper (Tiled)');
		});

		test('should leave labels with no access key as-is', () => {
			expect(AccessKeys.toText('No Access Key')).toBe('No Access Key');
		});

		test('should un-escape double ampersands', () => {
			expect(AccessKeys.toText('Foo && Bar&&Baz')).toBe('Foo & Bar&Baz');
		});

		test('should only remove one access key ampersand (the one actually treated as an access key)', () => {
			expect(AccessKeys.toText('&Foo, &Bar, &Baz')).toBe('Foo, &Bar, &Baz');
		});
	});

	test.describe('toHTML', () => {
		// toHTML relies on toFragment, which uses document.createFragment,
		// so we need to run these tests in a browser-like environment
		// jsdom would suffice, but it would feel weird to use it in a Playwright test
		// I could switch back to mocha+jsdom for unit tests like this,
		// it would be cleaner, code-wise, but I'd rather have one test framework...
		test.beforeEach(async ({ page }) => {
			await page.addScriptTag({ path: __dirname + '/../MenuBar.js' });
		});

		test('should return HTML with the access key as a span element', async ({ page }) => {
			expect(await page.evaluate(() => AccessKeys.toHTML('&New'))).toBe('<span class="menu-hotkey">N</span>ew');
		});

		test('should leave labels with no access key untouched', async ({ page }) => {
			expect(await page.evaluate(() => AccessKeys.toHTML('Just Plain'))).toBe('Just Plain');
		});

		test('should un-escape double ampersands, and escape them as HTML entities', async ({ page }) => {
			expect(await page.evaluate(() => AccessKeys.toHTML('Save && Exit'))).toBe('Save &amp; Exit');
		});

		test('should escape HTML syntax', async ({ page }) => {
			expect(await page.evaluate(() => AccessKeys.toHTML('<script>alert("hi")</script>'))).toBe('&lt;script&gt;alert("hi")&lt;/script&gt;');
		});

		test('should escape HTML syntax on either side of an access key', async ({ page }) => {
			expect(await page.evaluate(() => AccessKeys.toHTML('<&New>'))).toBe('&lt;<span class="menu-hotkey">N</span>ew&gt;');
		});

		test('should only highlight one access key', async ({ page }) => {
			expect(await page.evaluate(() => AccessKeys.toHTML('&Foo, &Bar, &Baz'))).toBe('<span class="menu-hotkey">F</span>oo, &amp;Bar, &amp;Baz');
		});
	});

	test.describe('toFragment', () => {
		// Note: toFragment is also tested by toHTML, so we don't need to test it exhaustively here.
		// Note 2: toFragment uses DOM APIs, hence running these tests in a page context.
		// These tests were much simpler in mocha+jsdom, and even simpler in cypress.
		test.beforeEach(async ({ page }) => {
			await page.addScriptTag({ path: __dirname + '/../MenuBar.js' });
		});

		test('should return a DocumentFragment with the access key as a span element', async ({ page }) => {
			const hFragment = await page.evaluateHandle(() =>
				AccessKeys.toFragment('E&xit')
			);
			expect(await hFragment.evaluate((fragment) => fragment.childNodes.length)).toBe(3);
			expect(await hFragment.evaluate((fragment) => fragment.childNodes[0].textContent)).toBe('E');
			expect(await hFragment.evaluate((fragment) => fragment.childNodes[1].textContent)).toBe('x');
			expect(await hFragment.evaluate((fragment) => fragment.childNodes[2].textContent)).toBe('it');
			// @ts-ignore
			expect(await hFragment.evaluate((fragment) => fragment.childNodes[1].className)).toBe('menu-hotkey');
		});

		test('should handle labels with no access key correctly', async ({ page }) => {
			const hFragment = await page.evaluateHandle(() =>
				AccessKeys.toFragment('Simple Label')
			);
			expect(await hFragment.evaluate((fragment) => fragment.childNodes.length)).toBe(1);
			expect(await hFragment.evaluate((fragment) => fragment.childNodes[0].textContent)).toBe('Simple Label');
		});

		test('should un-escape double ampersands', async ({ page }) => {
			expect(
				await page.evaluate(() =>
					AccessKeys.toFragment('Save && Exit').textContent
				)
			).toBe('Save & Exit');
		});
	});
});
