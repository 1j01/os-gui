const { AccessKeys } = require('../../MenuBar');

describe('AccessKeys', function () {
	describe('escape', function () {
		it('should escape a stranded ampersand', function () {
			expect(AccessKeys.escape('Save & Exit')).to.equal('Save && Exit');
		});

		it('should escape multiple ampersands', function () {
			expect(AccessKeys.escape('Save & Exit & Reload')).to.equal('Save && Exit && Reload');
		});

		it('should escape adjacent ampersands', function () {
			expect(AccessKeys.escape('Save && Exit')).to.equal('Save &&&& Exit');
		});

		it('should escape embedded ampersands', function () {
			expect(AccessKeys.escape('Foo&bar baz&quux')).to.equal('Foo&&bar baz&&quux');
		});

	});

	describe('unescape', function () {
		it('should unescape double ampersands', function () {
			expect(AccessKeys.unescape('Save && Exit')).to.equal('Save & Exit');
		});

		it('should not alter single ampersands', function () {
			expect(AccessKeys.unescape('Save & Exit')).to.equal('Save & Exit');
		});

		it('should unescape multiple double ampersands', function () {
			expect(AccessKeys.unescape('Save && Exit && Reload')).to.equal('Save & Exit & Reload');
		});

		it('should unescape triple ampersands (partially) I suppose', function () {
			expect(AccessKeys.unescape('Invalid &&& Access Key')).to.equal('Invalid && Access Key');
		});

		it('should unescape quadruple ampersands', function () {
			expect(AccessKeys.unescape('true &&&& false')).to.equal('true && false');
		});
	});

	describe('has', function () {
		it('should return true if label has an access key', function () {
			expect(AccessKeys.has('&Save')).to.be.true;
		});

		it('should return false if label does not have an access key', function () {
			expect(AccessKeys.has('Save')).to.be.false;
		});

		it('should return false if label is just an ampersand', function () {
			expect(AccessKeys.has('&')).to.be.false;
		});

		it('should return false if label has a stranded ampersand', function () {
			expect(AccessKeys.has('Save & Exit')).to.be.false;
		});

		it('should return true if label has a parenthetical and numeric access key', function () {
			expect(AccessKeys.has('First (&1)')).to.be.true;
		});
	});

	describe('get', function () {
		it('should return the access key from the label', function () {
			expect(AccessKeys.get('&Save')).to.equal('S');
		});

		it('should return the first access key if there appear to be multiple', function () {
			expect(AccessKeys.get('&Save &It')).to.equal('S');
		});

		it('should return null if there is no access key', function () {
			expect(AccessKeys.get('Save')).to.be.null;
		});

		it('should return null if label is just an ampersand', function () {
			expect(AccessKeys.get('&')).to.be.null;
		});

		it('should return null if label is just an escaped ampersand', function () {
			expect(AccessKeys.get('&&')).to.be.null;
		});

		it('should return null if label has a stranded ampersand', function () {
			expect(AccessKeys.get('Save & Exit')).to.be.null;
		});

		it('should return the parenthetical access key', function () {
			expect(AccessKeys.get('새로 만들기 (&N)')).to.equal('N');
		});
	});

	describe('remove', function () {
		it('should remove access key ampersand', function () {
			expect(AccessKeys.remove('E&xit')).to.equal('Exit');
		});

		it('should remove access key parentheticals', function () {
			expect(AccessKeys.remove('새로 만들기 (&N)')).to.equal('새로 만들기');
		});

		it('should preserve unmarked parentheticals', function () {
			expect(AccessKeys.remove('Foo (F) Bar (B)')).to.equal('Foo (F) Bar (B)');
		});

		it('should preserve multi-character parentheticals', function () {
			expect(AccessKeys.remove('Set As Wallpaper (&Tiled)')).to.equal('Set As Wallpaper (Tiled)');
		});

		it('should leave labels with no access key as-is', function () {
			expect(AccessKeys.remove('Boring Item')).to.equal('Boring Item');
		});

		it('should un-escape double ampersands', function () {
			expect(AccessKeys.remove('Foo && Bar&&Baz')).to.equal('Foo & Bar&Baz');
		});

		it('should only remove one access key ampersand (the one actually treated as an access key)', function () {
			expect(AccessKeys.remove('&Foo, &Bar, &Baz')).to.equal('Foo, &Bar, &Baz');
		});

		it('should preserve a parenthetical with an ampersand, unescaping it', function () {
			expect(AccessKeys.remove('I like ampersands (&&)')).to.equal('I like ampersands (&)');
		});
	});

	describe('toText', function () {
		it('should remove access key ampersand', function () {
			expect(AccessKeys.toText('E&xit')).to.equal('Exit');
		});

		it('should preserve access key parentheticals', function () {
			expect(AccessKeys.toText('새로 만들기 (&N)')).to.equal('새로 만들기 (N)');
		});

		it('should preserve unmarked parentheticals', function () {
			expect(AccessKeys.toText('Foo (F) Bar (B)')).to.equal('Foo (F) Bar (B)');
		});

		it('should preserve multi-character parentheticals', function () {
			expect(AccessKeys.toText('Set As Wallpaper (&Tiled)')).to.equal('Set As Wallpaper (Tiled)');
		});

		it('should leave labels with no access key as-is', function () {
			expect(AccessKeys.toText('No Access Key')).to.equal('No Access Key');
		});

		it('should un-escape double ampersands', function () {
			expect(AccessKeys.toText('Foo && Bar&&Baz')).to.equal('Foo & Bar&Baz');
		});

		it('should only remove one access key ampersand (the one actually treated as an access key)', function () {
			expect(AccessKeys.toText('&Foo, &Bar, &Baz')).to.equal('Foo, &Bar, &Baz');
		});
	});

	describe('toHTML', function () {
		it('should return HTML with the access key as a span element', function () {
			expect(AccessKeys.toHTML('&New')).to.equal('<span class="menu-hotkey">N</span>ew');
		});

		it('should leave labels with no access key untouched', function () {
			expect(AccessKeys.toHTML('Just Plain')).to.equal('Just Plain');
		});

		it('should un-escape double ampersands, and escape them as HTML entities', function () {
			expect(AccessKeys.toHTML('Save && Exit')).to.equal('Save &amp; Exit');
		});

		it('should escape HTML syntax', function () {
			expect(AccessKeys.toHTML('<script>alert("hi")</script>')).to.equal('&lt;script&gt;alert("hi")&lt;/script&gt;');
		});

		it('should escape HTML syntax on either side of an access key', function () {
			expect(AccessKeys.toHTML('<&New>')).to.equal('&lt;<span class="menu-hotkey">N</span>ew&gt;');
		});

		it('should only highlight one access key', function () {
			expect(AccessKeys.toHTML('&Foo, &Bar, &Baz')).to.equal('<span class="menu-hotkey">F</span>oo, &amp;Bar, &amp;Baz');
		});
	});

	describe('toFragment', function () {
		// toFragment is also tested by toHTML

		it('should return a DocumentFragment with the access key as a span element', function () {
			const fragment = AccessKeys.toFragment('E&xit');
			expect(fragment.childNodes.length).to.equal(3);
			expect(fragment.childNodes[0].textContent).to.equal('E');
			expect(fragment.childNodes[1].textContent).to.equal('x');
			expect(fragment.childNodes[2].textContent).to.equal('it');
			// @ts-ignore
			expect(fragment.childNodes[1].className).to.equal('menu-hotkey');
		});

		it('should handle labels with no access key correctly', function () {
			const fragment = AccessKeys.toFragment('Simple Label');
			expect(fragment.childNodes.length).to.equal(1);
			expect(fragment.childNodes[0].textContent).to.equal('Simple Label');
		});

		it('should un-escape double ampersands', function () {
			const fragment = AccessKeys.toFragment('Save && Exit');
			expect(fragment.textContent).to.equal('Save & Exit');
		});
	});
});
