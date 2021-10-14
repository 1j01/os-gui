const full_height_checkbox = document.getElementById('full-height-checkbox');
function update_full_height() {
	if (full_height_checkbox.checked) {
		document.body.style.height = "100%";
		document.documentElement.style.height = "100%";
	} else {
		document.body.style.height = "";
		document.documentElement.style.height = "";
	}
}
full_height_checkbox.addEventListener('change', update_full_height);
update_full_height();

document.getElementById("no-focus").addEventListener("mousedown", function (e) {
	e.preventDefault();
});
document.getElementById("no-focus-button").addEventListener("click", function (e) {
	e.target.textContent = "Clicked Button";
});

// $('#full-height-checkbox').change(function () {
// 	console.log('full-height changed');
// 	$('body, html').css('height', this.checked ? '100%' : '');
// }).trigger('change');

let disable_an_item = false;
const menus = {
	"&Dialogs": [
		{
			item: "&Generic",
			action: () => {
				const $w = $Window({ title: "Dialog", resizable: false, maximizeButton: false, minimizeButton: false });
				$w.$content.html("<p>Hello world.</p>");
				$w.$Button("OK", () => $w.close()).focus().css({ width: 100 });
			},
			shortcut: "Ctrl+Boring",
		},
	],
	"&Submenus": [
		{
			item: "&Physics",
			submenu: [
				{
					item: "&Schrödinger's Checkbox",
					checkbox: {
						check: () => {
							return Math.random() < 0.5;
						}
					}
				},
			]
		},
		{
			item: "&Many Items",
			submenu: new Array(100).fill(0).map((_, i) => ({
				item: `Item ${i}`,
				checkbox: {
					check: function () { return this.pointless_checkbox_value; },
					toggle: function () { this.pointless_checkbox_value = !this.pointless_checkbox_value; }
				},
				shortcut: `Ctrl+${i}`,
			}))
		},
		{
			item: "&Many Submenus",
			submenu: new Array(100).fill(0).map((_, i) => ({
				item: `Submenu ${i}`,
				submenu: [
					{
						item: "We Need To Go Deeper",
						submenu: [
							{
								item: "And We're Going Deeper",
								// I was hoping to make this infinite, using a getter, but it tries to build an infinite menu up front
								// (so I had to limit it)
								// can't do something like http://orteil.dashnet.org/nested apparently (without more thought)
								get submenu() {
									function recursive_submenu(n) {
										if (n > 5) {
											return [
												{
													item: "Okay, that's deep enough",
												}
											];
										}
										return new Array(2).fill(0).map((_, i) => ({
											item: `Recursion ${n} Submenu ${i}`,
											get submenu() {
												return recursive_submenu(n + 1);
											}
										}));
									}
									return recursive_submenu(1);
								}
							}
						]
					},
					...new Array(100).fill(0).map((_, j) => ({
						item: `Submenu ${i}.${j}`,
						checkbox: {
							check: function () { return this.pointless_checkbox_value; },
							toggle: function () { this.pointless_checkbox_value = !this.pointless_checkbox_value; }
						},
						shortcut: `Ctrl+${i}.${j}`,
					}))
				]
			}))
		},
	],
	"&Enabledness": [
		{
			item: "No action",
			shortcut: "Ctrl+Fake",
		},
		{
			item: "Disabled",
			enabled: false,
			shortcut: "Ctrl+Fake",
		},
		{
			item: "disabled: true?",
			disabled: true,
			shortcut: "Ctrl+Fake",
		},
		MENU_DIVIDER,
		{
			item: "Disable the below item",
			checkbox: {
				check: () => disable_an_item,
				toggle: () => disable_an_item = !disable_an_item,
			},
			shortcut: "Ctrl+Fake",
		},
		{
			item: "Conditionally disabled",
			enabled: () => !disable_an_item,
			shortcut: "Ctrl+Fake",
		},
	],
	"&Help": new Array(100).fill(0).map((_, i) => ({
		item: new Array(i+3).fill("A").join(""),
	})),
};

const $app_window_1 = new $Window({ title: "Application Window", resizable: true });
$app_window_1.$content.append(new MenuBar(menus).element);
$app_window_1.$content.append(`
	<p>This is a window that can be moved around and resized.</p>
`);
const $tool_window_1 = new $Window({ title: "Tool Window", toolWindow: true, parentWindow: $app_window_1 });
$tool_window_1.$content.text("This is a tool window.");
$app_window_1.on("closed", () => {
	$tool_window_1.close();
});
$tool_window_1.css({
	top: $app_window_1[0].offsetTop + $app_window_1[0].offsetHeight + 30,
	left: $app_window_1[0].offsetLeft,
});
const open_recursive_dialog = (x, y) => {
	const $w = $Window({ title: "Recursive Dialog", resizable: false, maximizeButton: false, minimizeButton: false });
	$w.$content.html("<p>I want more. More!</p>");
	$w.$Button("Recurse", () => {
		open_recursive_dialog(x + 20, y + 20);
		x -= 40;
		throw new Error("Don't close automatically please...");
	}).focus().css({ width: 100 });
	$w.$Button("Cancel", () => $w.close()).css({ width: 100 });
	$w.css({
		left: x,
		top: y
	});
};

$app_window_1.$Button("Recursive Dialog", (e) => {
	open_recursive_dialog(innerWidth/2, innerHeight/2);
	throw new Error("Don't close automatically please...");
});

$app_window_1.$Button("Test Focus", (e) => {
	// $tool_window_1.focus();
	setTimeout(() => $tool_window_1.focus(), 1000);
	
	throw new Error("Don't close automatically please...");
});

// Test tabstop wrapping by creating many windows with different types of controls.
$app_window_1.$Button("Test Tabstop Wrapping", (e) => {
	let x = 0;
	let y = 300;
	const w = 200;
	const h = 200;
	for (const control_html of [
		"<input type='text'/>",
		"<input type='radio'/>(no <code>name</code>, pointless)",
		"<input type='radio' name='radio-group-1-0'/>(named group of 1, pointless)",
		"<input type='radio' name='radio-group-1-1'/><input type='radio' name='radio-group-1-1'/>(named group of 2)",
		"<input type='radio' name='radio-group-1-2'/><input type='radio' name='radio-group-1-2' checked/>(named group of 2)",
		"<input type='radio' name='radio-group-1-3' checked/><input type='radio' name='radio-group-1-3'/>(named group of 2)",
		"<input type='checkbox'/>",
		"<select></select>",
		"<textarea></textarea>",
		"<button>button</button>",
		"<a href='#'>link</a>",
		"<div>no controls</div>", // not a control :)
		"<div tabIndex='-1'>tabIndex=-1</div>",
		"<div tabIndex='0'>tabIndex=0</div>",
	]) {
		const $w = $Window({ title: "Tabstop Wrapping", resizable: false, maximizeButton: false, minimizeButton: false });
		$w.$content.html(`
			<h2 style="font-size: 1em">First Control</h2>
			${control_html}
			<h2 style="font-size: 1em">Last Control</h2>
			${control_html.replace(/radio-group-1/g, "radio-group-2")}
		`);
		$w.css({ left: x, top: y, width: w, height: h });
		x += w + 10;
		if (x > innerWidth - w) {
			x = 0;
			y += h + 10;
		}
	}
	throw new Error("Don't close automatically please...");
});

// Radio buttons should be treated as a group with one tabstop.
// If there's no selected ("checked") radio, it should still visit the group,
// but if there is a selected radio in the group, it should skip all unselected radios in the group.

// todo: test <label> surrounding or not surrounding <input> (do labels even factor in to tabstop wrapping?)
// test hidden controls, disabled controls


const $app_window_2 = new $Window({ title: "Selectable Text", resizable: true });
$app_window_2.$content.append(`
	<p style="user-select: text; cursor: text">You should be able to select text in this window.</p>
	<p style="user-select: text; cursor: text">I also have a control that should be default-focused but not if you select text.</p>
	<button>Button</button>
	<button class="default" disabled>Disabled Default Button</button>
	<button class="default">True Default Button</button>
	<p style="user-select: text; cursor: text">Make sure you test selecting text as the first thing you do upon loading the page.</p>
`);
$app_window_2.css({
	left: innerWidth * 0.3,
	top: innerHeight * 0.75,
});
