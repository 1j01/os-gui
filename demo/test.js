const full_height_checkbox_maybe = document.getElementById('full-height-checkbox');
const rtl_checkbox_maybe = document.getElementById('rtl-checkbox');
const debug_focus_checkbox_maybe = document.getElementById('debug-focus-checkbox');
const override_transition_duration_checkbox_maybe = document.getElementById('override-transition-duration-checkbox');
const taskbar_checkbox_maybe = document.getElementById('taskbar-checkbox');
const taskbar_like = document.getElementById("no-focus");
const no_focus_button = document.getElementById("no-focus-button");
const taskbar_button_like = document.getElementById("minimize-target");
if (!full_height_checkbox_maybe || !rtl_checkbox_maybe || !debug_focus_checkbox_maybe || !override_transition_duration_checkbox_maybe || !taskbar_checkbox_maybe || !taskbar_like || !no_focus_button || !taskbar_button_like) {
	throw new Error("Missing checkbox(es)");
}
if (!(full_height_checkbox_maybe instanceof HTMLInputElement) || !(rtl_checkbox_maybe instanceof HTMLInputElement) || !(debug_focus_checkbox_maybe instanceof HTMLInputElement) || !(override_transition_duration_checkbox_maybe instanceof HTMLInputElement) || !(taskbar_checkbox_maybe instanceof HTMLInputElement)) {
	throw new Error("Unexpected type for checkbox(es)");
}
const full_height_checkbox = full_height_checkbox_maybe;
const rtl_checkbox = rtl_checkbox_maybe;
const debug_focus_checkbox = debug_focus_checkbox_maybe;
const override_transition_duration_checkbox = override_transition_duration_checkbox_maybe;
const taskbar_checkbox = taskbar_checkbox_maybe;

function update_full_height() {
	document.body.style.height = document.documentElement.style.height = full_height_checkbox.checked ? "100%" : "";
}
function update_rtl() {
	document.body.dir = rtl_checkbox.checked ? "rtl" : "ltr";
}
function update_debug_focus() {
	$Window.DEBUG_FOCUS = debug_focus_checkbox.checked;
}
function update_override_animation_duration() {
	$Window.OVERRIDE_TRANSITION_DURATION = override_transition_duration_checkbox.checked ? 5000 : undefined;
}
function update_taskbar() {
	document.documentElement.classList.toggle("taskbar-enabled", taskbar_checkbox.checked);	
	if (taskbar_checkbox.checked) {
		for (const window_el of document.querySelectorAll(".os-window")) {
			// @ts-ignore (TODO: A $Window.fromElement (or similar) static method using a Map would be better)
			// (or something like $Window.allWindows)
			window_el.$window.setMinimizeTarget(document.getElementById("minimize-target"));
		}
	} else {
		for (const window_el of document.querySelectorAll(".os-window")) {
			// @ts-ignore (TODO: A $Window.fromElement (or similar) static method using a Map would be better)
			// (or something like $Window.allWindows)
			window_el.$window.setMinimizeTarget(null);
		}
	}
}

full_height_checkbox.addEventListener('change', update_full_height);
rtl_checkbox.addEventListener('change', update_rtl);
debug_focus_checkbox.addEventListener('change', update_debug_focus);
override_transition_duration_checkbox.addEventListener('change', update_override_animation_duration);
taskbar_checkbox.addEventListener('change', update_taskbar);
update_full_height();
update_rtl();
update_debug_focus();
update_override_animation_duration();
setInterval(update_taskbar, 200); // for new windows

taskbar_like.addEventListener("mousedown", function (e) {
	e.preventDefault();
});
no_focus_button.addEventListener("click", function (e) {
	if (!(e.target instanceof HTMLElement)) { throw new Error("Unexpected type for event target"); }
	e.target.textContent = "Clicked Button";
});
taskbar_button_like.addEventListener("click", function (e) {
	for (const window_el of document.querySelectorAll(".os-window")) {
		// @ts-ignore (TODO: A $Window.fromElement (or similar) static method using a Map would be better)
		// (or something like $Window.allWindows)
		window_el.$window.unminimize();
	}
});

/** @type {OSGUI$Window} */
let $main_test_window;
/** @type {OSGUI$Window} */
let $tool_window_1;
/** @type {OSGUI$Window} */
let $selection_test_window;
/** @type {OSGUI$Window} */
let $iframe_test_window;
/** @type {OSGUI$Window} */
let $icon_test_window;
/** @type {OSGUI$Window} */
let $theme_test_window;

let disable_an_item = false;
/** @type {number} */
let radio_value;
/** @type {OSGUITopLevelMenus} */
const menus = {
	"&Dialogs": [
		{
			label: "&Generic",
			action: () => {
				const $w = $Window({ title: "Dialog", resizable: false, maximizeButton: false, minimizeButton: false });
				$w.$content.html("<p>Hello world.</p>");
				$w.$Button("OK", () => $w.close()).focus().css({ width: 100 });
				$w.center();
			},
			shortcutLabel: "Ctrl+Boring",
		},
	],
	"&Submenus": [
		{
			label: "&Physics",
			submenu: [
				{
					label: "&Schrödinger's Checkbox",
					checkbox: {
						check: () => {
							return Math.random() < 0.5;
						}
					}
				},
			]
		},
		{
			label: "&Many Items",
			submenu: [
				{
					radioItems: new Array(100).fill(0).map((_, i) => ({
						label: `Radio ${i}`,
						value: i,
						shortcutLabel: `Ctrl+${i}`,
					})),
					getValue: () => radio_value,
					setValue: (new_value) => {
						radio_value = new_value;
					},
					ariaLabel: "Demo Radio Group",
				},
			],
		},
		{
			label: "&No Items",
			submenu: [],
		},
		{
			label: "&Disabled",
			submenu: [],
			enabled: false,
		},
		{
			label: "&Many Submenus",
			// this can get very slow to load with a lot of submenus, because it creates the DOM structure for the entire thing
			// so I've limited it for now, maybe later we can make it render as needed, perhaps optionally; I'm not sure of the implications on accessibility
			submenu: new Array(3).fill(0).map((_, i) => ({
				label: `Submenu ${i}`,
				submenu: [
					{
						label: "We Need To Go Deeper",
						submenu: [
							{
								label: "And We're Going Deeper",
								// I was hoping to make this infinite, using a getter, but it tries to build an infinite menu up front
								// (so I had to limit it)
								// can't do something like http://orteil.dashnet.org/nested apparently (without more thought)
								get submenu() {
									/**
									 * @param {number} n  recursion level
									 * @returns {OSGUIMenuItem[]}
									 */
									function recursive_submenu(n) {
										if (n > 5) {
											return [
												{
													label: "Okay, that's deep enough",
												}
											];
										}
										return new Array(2).fill(0).map((_, i) => ({
											label: `Recursion ${n} Submenu ${i}`,
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
						label: `Submenu ${i}.${j}`,
						checkbox: {
							check: function () { return this.pointless_checkbox_value; },
							toggle: function () { this.pointless_checkbox_value = !this.pointless_checkbox_value; },
							pointless_checkbox_value: false,
						},
						shortcutLabel: `Ctrl+${i}.${j}`,
					}))
				]
			}))
		},
		{
			label: "&Not A Submenu",
		},
	],
	"&Enabled": [
		{
			label: "No action",
			shortcutLabel: "Ctrl+Fake",
		},
		{
			label: "Disabled",
			enabled: false,
			shortcutLabel: "Ctrl+Fake",
		},
		{
			label: "Disabled Checked",
			enabled: false,
			shortcutLabel: "Ctrl+Fake",
			checkbox: {
				check: () => true,
				toggle: () => { }
			},
		},
		{
			label: "Disabled Submenu",
			enabled: false,
			shortcutLabel: "Ctrl+Fake",
			submenu: [],
		},
		{
			label: "disabled: true?",
			// @ts-ignore (not part of the API; maybe should be, since DOM uses `disabled` as an attribute, not `enabled`)
			disabled: true,
			shortcutLabel: "Ctrl+Fake",
		},
		MENU_DIVIDER,
		{
			label: "Disable the below item",
			checkbox: {
				check: () => disable_an_item,
				toggle: () => disable_an_item = !disable_an_item,
			},
			shortcutLabel: "Ctrl+Fake",
		},
		{
			label: "Conditionally disabled",
			enabled: () => !disable_an_item,
			shortcutLabel: "Ctrl+Fake",
		},
		MENU_DIVIDER,
		{
			label: "Show All &Icons As Disabled",
			checkbox: {
				check: () => document.body.classList.contains("show-disabled-icons"),
				toggle: () => document.body.classList.toggle("show-disabled-icons"),
			},
		},
	],
	"Access Keys (&A)": [
		{
			label: "&At Start",
		},
		{
			label: "At &Middle Word",
		},
		{
			label: "In Mid&dle",
		},
		{
			label: "Ampersand At End? &",
		},
		{
			label: "Escaping && with &&&&",
		},
		{
			label: "Not escaped but floating & (no letter after)",
		},
		{
			label: "&",
			shortcutLabel: "(Just '&')",
		},
		{
			label: "&&",
			shortcutLabel: "(Just '&&')",
		},
		{
			label: "No access key",
		},
		{
			label: "Duplicate access key (&A)",
		},
		{
			label: "Another duplicate (implicit)",
		},
		{
			label: "&Multiple &Supposed &Access Keys",
		},
	],
	"&Loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong Menu Button Text": [
	],
	"&Help": new Array(100).fill(0).map((_, i) => ({
		label: new Array(i + 3).fill("A").join(""),
	})),
};

$main_test_window = new $Window({
	title: "Test Station",
	resizable: false,
	icons: { 16: "https://win98icons.alexmeub.com/icons/png/application_hammer_grouppol-0.png" },
	innerWidth: 300,
	// innerHeight: 600,
});
$main_test_window.setMenuBar(new MenuBar(menus));
$main_test_window.$content.append(`
	<button id="open-recursive-dialog">
		<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/accessibility_two_windows.png" width="32" height="32" style="vertical-align: middle;" />
		Recursive Dialog
	</button>
	<button id="test-tabstop-wrapping">
		<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/accessibility_big_keys.png" width="32" height="32" style="vertical-align: middle;" />
		Tabstop Wrapping
	</button>
	<button id="test-iframes">
		<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/html-3.png" width="32" height="32" style="vertical-align: middle;" />
		Nested Iframes
	</button>
	<button id="test-selection">
		<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/file_lines-0.png" width="32" height="32" style="vertical-align: middle;" />
		Selectable Text
	</button>
	<button id="test-icon-size">
		<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/camera3_network-3.png" width="32" height="32" style="vertical-align: middle;" />
		Icon Size + Long Title
	</button>
	<button id="test-theme">
		<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/themes-0.png" width="32" height="32" style="vertical-align: middle;" />
		Window Theme
	</button>
	<button id="test-triggering">
		<img draggable="false" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAl1JREFUWEfVVltywyAMFBeLc7EacC+W5GClswIRWQY/Ejcz5SvBoF1pV7IdqRUiJfx1ehM72EhEyRG5ROTD/Ig+fvR3xQI4/nyNQiCjMqNCAjvT5Ch43p/xPAos5+dBnEuUcmhk+pMASOR9rgsecyVOAl9U28rhx5xxJsAFOn11g4ZAKRMg8pFl+DCBmAnESBQCJ/5ZAjG4NI6Jpm9IsGyOs7SYZRVjTPC342QDMQF4ICQKATrkJZe8929XpQYA+PV6rSDDMMySjNCirHEcyTm+eg4BC75W3svlQtM0kZfefFMLB3BktHcBHOtUArr0a0Rut1t9/G8IxDzIyXf8whL8VQUALuLCrWJjTaZJQEptiR2RQIPDNZjmXIpn6+Q2alUALYi2e5XAGriQER5dAvf7feFHW4HeGRgU2drMc//kJTIsCCD7VmBcEgIA6IGjapgVZVDVsvdkYAI6VQTXU8+WYQ/44/HgayDM8YwHtAzlY2vvGKJ25mVs82dDWToJkQSPBBwVHIYhD3S1Ei4eeclow4nD5TNSSFhPiHxNAorM5otGhgx6vWU4VESTQGwNrlqSYWubwhdbo9YOGSGu3Y89TcCCLwiU8nMs0ajljrXMbdkkZgt8QWANtJrLjNdW5lJKbTicg+Y2Ib0hBpQzTQ9I6Tt9zXfVzF9ovkZAfMCzYcMDdXZoMDPrN8GtBNqI+pl0VSXfM+CRzHtlZhkwToteWpbn9+OzY1pvuV2Zr+nMlSyGtLMF+0lGrDIm/0Tf99ze6qaWBPrcU+dSFQM8M7CQ7rn9FQJNMmd8iuvAv0XzaDC1qAqpAAAAAElFTkSuQmCC" width="32" height="32" style="vertical-align: middle;" />
		Trigger Station
	</button>
`);
$main_test_window.$content.css({
	display: "flex",
	flexDirection: "column",
	justifyContent: "stretch",
}).find("button").css({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	margin: "0.2em",
}).addClass("lightweight").find("img").css({
	marginRight: "0.5em",
	marginLeft: "0.5em",
});
$tool_window_1 = new $Window({ title: "Tool Window", toolWindow: true, parentWindow: $main_test_window });
$tool_window_1.$content.append(`
	<p>This tool window has controls in it:</p>
	<input type="text" placeholder="Text input">
	<button>Button</button>
`);
$($main_test_window.element).on("close", (event) => {
	console.log("Main test window close event");
	event.preventDefault();
	const $confirm_window = new $Window({
		title: "Confirm Close",
		parentWindow: $main_test_window,
		resizable: false,
		// innerWidth: 400,
		// innerHeight: 200,
		maximizeButton: false,
		minimizeButton: false,
	});
	$confirm_window.$content.append(`
		<p>Are you sure you want to close this window?</p>
	`);
	$confirm_window.$Button("Close", () => {
		$main_test_window.close(true);
	}).focus();
	$confirm_window.$Button("Cancel");
});
$($main_test_window).on("closed", () => {
	console.log("Main test window closed");
	$tool_window_1.close();
});
const open_recursive_dialog = (/** @type {number} */ x, /** @type {number} */ y, /** @type {boolean} */ from_drag = false) => {
	const $w = $Window({
		title: "Recursive Dialog", resizable: false, maximizeButton: false, minimizeButton: false,
		icons: {
			32: "https://win98icons.alexmeub.com/icons/png/accessibility_two_windows.png",
			16: "https://win98icons.alexmeub.com/icons/png/appwizard-1.png",
		},
	});
	const messages = from_drag ? [
		"Ugh, what a drag!",
		"I can't believe you've dragged me into this mess.",
		"These jokes are really dragging on, aren't they?",
		// spell-checker: disable
		"Beware: Here be draggin's.",
		// spell-checker: enable
	] : [
		"I want more. More!",
		"The meek shall inherit the earth.",
		"Are you sure you want to recurse?",
		"🎶 Spiraling out of control, and deeper down the rabbit hole... 🎶",
		// spell-checker: disable
		"Recursion is the best kind of cursion.", // this one is from the AI autocomplete, don't blame me
		// spell-checker: enable
		"It seems I've been inflicted with a terrible curse... a recurse!",
		"Putting the 'di-' in dialog! Because 'di-' means two... get it? Two dialogs?",
		"Putting the 'mess' in 'message box'!",
	];
	$w.$content.html(`<p>${messages[Math.floor(Math.random() * messages.length)]}</p>`);
	$w.$Button("Recurse", () => {
		open_recursive_dialog(x - 90, y + 100);
		open_recursive_dialog(x + 90, y + 100);
	}).focus().css({ width: 100 });
	$w.$Button("Cancel", () => $w.close()).css({ width: 100 });
	$($w.element).css({
		left: x,
		top: y
	});
	$w.onBeforeDrag(() => {
		const offset = $($w.element).offset();
		if (!offset) { throw new Error(`Unexpected ${offset} offset`); }
		const $recursed = open_recursive_dialog(offset.left, offset.top, true);
		// ensure it's hidden behind the dragged window
		if ($recursed.element.offsetWidth > $w.element.offsetWidth) {
			$recursed.$content.find("p").text("Ugh, what a drag!");
		}
	});
	return $w;
};

$main_test_window.$content.find("#open-recursive-dialog").on("click", () => {
	open_recursive_dialog(innerWidth / 2, innerHeight / 2);
});

// Radio buttons should be treated as a group with one tabstop.
// If there's no selected ("checked") radio, it should still visit the group,
// but if there is a selected radio in the group, it should skip all unselected radios in the group.

// todo: test <label> surrounding or not surrounding <input> (do labels even factor in to tabstop wrapping?)
// test hidden controls, disabled controls

function test_tabstop_wrapping() {
	// Test tabstop wrapping by creating many windows with different types of controls.
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
		"<div tabIndex='-1'>tabIndex=-1 (not tabbable)</div>",
		"<div tabIndex='0'>tabIndex=0 (tabbable)</div>",
		"<div contenteditable='true'>contenteditable=true</div><br><div contenteditable='true'>another contenteditable=true</div>",
		"<div contenteditable='false'>contenteditable=false (not tabbable)</div>",
		"<div contenteditable='plaintext-only'>contenteditable=plaintext-only</div><br><div contenteditable='plaintext-only'>another contenteditable=plaintext-only</div>",
		"<div tabIndex='-1' contenteditable='true'>tabIndex=-1, contenteditable=true (not tabbable)</div>",
		"<audio controls></audio>",
		"<video controls></video>",
	]) {
		const $w = $Window({
			title: "Tabstop Wrapping",
			resizable: false,
			maximizeButton: false,
			minimizeButton: false,
			// icons: {
			// 	32: "https://win98icons.alexmeub.com/icons/png/accessibility_big_keys.png",
			// 	16: "https://win98icons.alexmeub.com/icons/png/accessibility-5.png",
			// },
		});
		$w.$content.html(`
			<h2 style="font-size: 1em">First Control</h2>
			${control_html}
			<h2 style="font-size: 1em">Last Control</h2>
			${control_html.replace(/radio-group-1/g, "radio-group-2")}
		`).css({
			overflow: "auto",
		});
		$($w.element).css({ left: x, top: y, width: w, height: h });
		x += w + 10;
		if (x > innerWidth - w) {
			x = 0;
			y += h + 10;
		}
		$w.focus(); // (will focus the last one)
	}
}

$main_test_window.center();
$($tool_window_1.element).css({
	top: $main_test_window.element.offsetTop + $main_test_window.element.offsetHeight + 30,
	left: $main_test_window.element.offsetLeft,
});

function test_selectable_text() {
	$selection_test_window = new $Window({
		title: "Selectable Text",
		resizable: true,
		icons: {
			16: "https://win98icons.alexmeub.com/icons/png/file_lines-1.png",
			32: "https://win98icons.alexmeub.com/icons/png/file_lines-0.png",
		},
	});
	$selection_test_window.$content.append(`
		<p style="user-select: text; cursor: text">You should be able to select text in this window.</p>
		<p style="user-select: text; cursor: text">I also have a control that should be default-focused but not if you select text.</p>
		<button>Button</button>
		<button class="default" disabled>Disabled Default Button</button>
		<button class="default">True Default Button</button>
		<p style="user-select: text; cursor: text">Make sure you test selecting text as the first thing you do upon loading the page.</p>
	`);
	$($selection_test_window.element).css({
		left: innerWidth * 0.3,
		top: innerHeight * 0.75,
	});
	$selection_test_window.focus();
}

function test_iframes() {
	$iframe_test_window = new $Window({
		title: "Iframe Window",
		resizable: true,
		icons: {
			16: "https://win98icons.alexmeub.com/icons/png/html-4.png",
			32: "https://win98icons.alexmeub.com/icons/png/html-3.png",
			48: "https://win98icons.alexmeub.com/icons/png/html-5.png",
		},
	});
	$iframe_test_window.setMenuBar(new MenuBar(menus));
	$iframe_test_window.$content.append(`
		<iframe class="inset-deep"></iframe>
	`);
	$iframe_test_window.$content.find("iframe").attr("srcdoc", `
		<p>This is an iframe test.</p>
		<p>You should be able to focus controls, and restore focus when focusing the window.</p>
		<p>Focus should be restored after selecting menu items.</p>
		<button>Button</button>
		<textarea>Text Area</textarea>
		<iframe class="inset-deep" srcdoc='<p>Nested iframe!</p><button>Button</button>' style="width: 200px; height: 100px;"></iframe>
		<iframe class="inset-deep" src="https://urlme.me/true_story/cross-origin/can't_work.jpg" style="width: 400px; height: 400px;"></iframe>
		<p>You should also be able to select text in this window.</p>
		<link rel="stylesheet" href="../build/layout.css">
		<link rel="stylesheet" href="../build/windows-98.css">
	`).css({
		boxSizing: "border-box",
		display: "flex",
		flex: 1,
		margin: 30,
	}).focus();
	$($iframe_test_window.element).css({
		left: innerWidth * 0.05,
		top: innerHeight * 0.5,
		width: 500,
		height: 400,
	});
	$iframe_test_window.$content.css({
		paddingTop: "2px",
		display: "flex",
		flexDirection: "column",
	});
}

function test_icon_sizes() {
	const emoji_el = $("<span/>").text("📷")[0];
	$icon_test_window = new $Window({
		title: "Icon Size Test — and a Long Titlebar Text (also known as a window caption)",
		resizable: true,
		icons: {
			"16": "https://win98icons.alexmeub.com/icons/png/camera3_network-5.png",
			"32": "https://win98icons.alexmeub.com/icons/png/camera3_network-3.png",
			"48": "https://win98icons.alexmeub.com/icons/png/camera3_network-4.png",
			"any": emoji_el,
		},
	});
	$icon_test_window.$content.append(`
		<p>See different titlebar and icon sizes.</p>
		<p><label>
			<input type="checkbox" id="any-size" checked>
			Include "any" icon size (with an emoji 📷)
		</label></p>
	`);
	$icon_test_window.$content.find("#any-size").on("change", (e) => {
		if (!(e.target instanceof HTMLInputElement)) { throw new Error("Unexpected type for event target"); }
		if (e.target.checked) {
			$icon_test_window.icons.any = emoji_el;
		} else {
			delete $icon_test_window.icons.any;
		}
	});
	for (const size of [8, 16, 24, 32, 48, 64, 128]) {
		const initially_selected = $icon_test_window.getTitlebarIconSize() === size;
		const $button = $(`<button class="toggle">${size}px</button>`)
			.attr("aria-pressed", initially_selected ? "true" : "false")
			.addClass(initially_selected ? "selected" : "")
			.css("font-weight", $icon_test_window.icons[size] ? "bold" : "normal")
			.appendTo($icon_test_window.$content);
		$button.on("click", () => {
			$icon_test_window.$titlebar.css({
				height: size + 2,
			});
			emoji_el.style.fontSize = `${size * 0.9}px`; // before setTitlebarIconSize() which clones it
			$icon_test_window.setTitlebarIconSize(size);
			$icon_test_window.$content.find("button.selected").removeClass("selected").attr("aria-pressed", "false");
			$button.addClass("selected").attr("aria-pressed", "true");
		});
	}
	$($icon_test_window.element).css({
		left: innerWidth * 0.8,
		top: innerHeight * 0.5,
	});
	$icon_test_window.focus();
}

function test_triggering() {
	const $trigger_test_window = new $Window({
		title: "Trigger Station",
		resizable: true,
		icons: {
			// Custom 16x16 icon
			16: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAASdJREFUOE+NkwuShCAMRDsX83OwIQQPpl5sstVRWHTcD1VqYOiXTmAE3cgmDve2IoKYxrffp5A6bUE2OCfpJXA5tvPDSHCuObAUQbbIE9oGOIjioeKyO95vYFkAzbha6HQ3wLdPM/grAYsJ1AgIgx/jZ0CGJwVKEahGSX8DspkLHCxPkJGSN0A22miFBk5V2d9jmJlP09Q2jeN4sWsdIKUEOaTH+y5+qrWuDcOAUgqzHwCKSfzvoBiqCHkF9NZ/A23bhqSKwvtydjUc3AHrugZnnufGo5i22UqKG+QJwAbmnBuA4pqEMUuokA8HFO/7fqlkGMfIzLqLWXPC+SOAWXhMteYmPiE80ssp9On4A+0TEHHN3NVeT6Bez/6fGmI+/aiN6+5yC78AaxabjWK9MHoAAAAASUVORK5CYII=",
			// "Real" 32x32 icon
			32: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAl1JREFUWEfVVltywyAMFBeLc7EacC+W5GClswIRWQY/Ejcz5SvBoF1pV7IdqRUiJfx1ehM72EhEyRG5ROTD/Ig+fvR3xQI4/nyNQiCjMqNCAjvT5Ch43p/xPAos5+dBnEuUcmhk+pMASOR9rgsecyVOAl9U28rhx5xxJsAFOn11g4ZAKRMg8pFl+DCBmAnESBQCJ/5ZAjG4NI6Jpm9IsGyOs7SYZRVjTPC342QDMQF4ICQKATrkJZe8929XpQYA+PV6rSDDMMySjNCirHEcyTm+eg4BC75W3svlQtM0kZfefFMLB3BktHcBHOtUArr0a0Rut1t9/G8IxDzIyXf8whL8VQUALuLCrWJjTaZJQEptiR2RQIPDNZjmXIpn6+Q2alUALYi2e5XAGriQER5dAvf7feFHW4HeGRgU2drMc//kJTIsCCD7VmBcEgIA6IGjapgVZVDVsvdkYAI6VQTXU8+WYQ/44/HgayDM8YwHtAzlY2vvGKJ25mVs82dDWToJkQSPBBwVHIYhD3S1Ei4eeclow4nD5TNSSFhPiHxNAorM5otGhgx6vWU4VESTQGwNrlqSYWubwhdbo9YOGSGu3Y89TcCCLwiU8nMs0ajljrXMbdkkZgt8QWANtJrLjNdW5lJKbTicg+Y2Ib0hBpQzTQ9I6Tt9zXfVzF9ovkZAfMCzYcMDdXZoMDPrN8GtBNqI+pl0VSXfM+CRzHtlZhkwToteWpbn9+OzY1pvuV2Zr+nMlSyGtLMF+0lGrDIm/0Tf99ze6qaWBPrcU+dSFQM8M7CQ7rn9FQJNMmd8iuvAv0XzaDC1qAqpAAAAAElFTkSuQmCC",
		},
	});
	/** @type {HTMLElement & { $window: OSGUI$Window }}} */
	let target_window_el = $trigger_test_window.element;
	$trigger_test_window.$content.append(`
		<p>
			Target window: <b id="target-window-text" style="display: inline-block; width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; vertical-align: text-bottom;">
				Self
			</b>
			<button id="pick-target-window-button">
				<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/mouse_location.png" alt="" style="width: 32px; height: 32px; vertical-align: middle;">
				Pick Target...
			</button>
		</p>
		<p>
			<label for="delay-input">
				<img draggable="false" alt="" src='https://win98icons.alexmeub.com/icons/png/clock-0.png' width='16' height='16' style='vertical-align: text-bottom;' />
				Delay:
			</label>
			<input type="number" id="delay-input" value="1500" min="0" max="10000" step="100" style="width: 50px;">
		</p>
		<br>
		<button id="test-immediate-focus">Focus Now</button>
		<button id="test-delayed-focus">
			Focus
			<img draggable="false" alt="delayed" src='https://win98icons.alexmeub.com/icons/png/clock-0.png' width='16' height='16' style='vertical-align: middle;' />
		</button>
		<br>
		<br>
		<button id="test-delayed-minimize">
			Minimize
			<img draggable="false" alt="delayed" src='https://win98icons.alexmeub.com/icons/png/clock-0.png' width='16' height='16' style='vertical-align: middle;' />
		</button>
		<button id="test-delayed-maximize">
			Maximize
			<img draggable="false" alt="delayed" src='https://win98icons.alexmeub.com/icons/png/clock-0.png' width='16' height='16' style='vertical-align: middle;' />
		</button>
		<button id="test-delayed-close">
			Close
			<img draggable="false" alt="delayed" src='https://win98icons.alexmeub.com/icons/png/clock-0.png' width='16' height='16' style='vertical-align: middle;' />
		</button>
		(Test that menus, submenus, and child windows close)
		<br>
		<h3>Trigger mouse events on a delay</h3>
		<p>Click buttons then quickly click elsewhere to see if the window is refocused.</p>
		<p>Currently "click" events don't refocus, but "mousedown" and "pointerdown" do.</p>
	`);
	const delay_input = $trigger_test_window.$content.find("#delay-input")[0];
	if (!(delay_input instanceof HTMLInputElement)) {
		throw new Error("Expected delay input to be an <input> element");
	}
	let delay = parseInt(delay_input.value);
	delay_input.addEventListener("change", () => {
		delay = parseInt(delay_input.value);
	});

	$trigger_test_window.$content.find("#pick-target-window-button").click(() => {
		pick_el(".os-window", (window_el) => {
			if (!window_el) { return console.log("No window picked"); }
			target_window_el = /** @type {HTMLElement & { $window: OSGUI$Window; }} */(window_el);
			$trigger_test_window.$content.find("#target-window-text").text(window_el.querySelector(".window-title")?.textContent ?? "Untitled???");
		}, "Select a target window for testing.");
	});

	$trigger_test_window.$content.find("#test-delayed-focus").on("click", () => {
		setTimeout(() => target_window_el.$window.focus(), delay);
	});
	$trigger_test_window.$content.find("#test-delayed-close").on("click", () => {
		setTimeout(() => target_window_el.$window.close(), delay);
	});
	$trigger_test_window.$content.find("#test-delayed-minimize").on("click", () => {
		setTimeout(() => target_window_el.$window.minimize(), delay);
	});
	$trigger_test_window.$content.find("#test-delayed-maximize").on("click", () => {
		setTimeout(() => target_window_el.$window.maximize(), delay);
	});
	$trigger_test_window.$content.find("#test-immediate-focus").on("click", () => {
		target_window_el.$window.focus();
	});

	const $table = $("<table>").appendTo($trigger_test_window.$content);
	for (const trigger_style of ["jQuery", "native"]) {
		const $tr = $("<tr>").appendTo($table);
		for (const event_type of ["click", "pointerdown", "mousedown"]) {
			const $td = $("<td>").appendTo($tr).append(
				$("<button>").text(
					`Trigger ${event_type} (${trigger_style})`
				).click(() => {
					setTimeout(() => {
						if (trigger_style === "jQuery") {
							$trigger_test_window.$content.find("p").trigger(event_type);
						} else {
							$trigger_test_window.$content.find("p")[0].dispatchEvent(new Event(event_type, {
								bubbles: true,
								cancelable: true,
							}));
						}
					}, delay);
				}).prepend(`
					<img draggable="false" src='https://win98icons.alexmeub.com/icons/png/mouse-2.png' width='16' height='16' style='vertical-align: middle;' />
				`).append(`
					<img draggable="false" alt="delayed" src='https://win98icons.alexmeub.com/icons/png/clock-0.png' width='16' height='16' style='vertical-align: middle;' />
				`)
			);
		}
	}

	$trigger_test_window.focus();
}

function test_window_theme() {
	$theme_test_window = new $Window({
		title: "Window Theme Applier",
		resizable: false,
		icons: {
			16: "https://win98icons.alexmeub.com/icons/png/themes-1.png",
			32: "https://win98icons.alexmeub.com/icons/png/themes-0.png",
			48: "https://win98icons.alexmeub.com/icons/png/themes-2.png",
		},
	});
	$theme_test_window.$content.append(`
		<div style="margin: 10px;">
			<select id="theme-select"></select>
		</div>
		<div style="margin: 10px;">
			<button id="theme-self">
				<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/themes-0.png" alt="" style="width: 32px; height: 32px; vertical-align: middle;">
				Theme Self
			</button>
			<button id="theme-other">
				<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/mouse_location.png" alt="" style="width: 32px; height: 32px; vertical-align: middle;">
				Theme Window...
			</button>
			<button id="theme-anything">
				<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/mouse_location.png" alt="" style="width: 32px; height: 32px; vertical-align: middle;">
				Theme Anything...
			</button>
			<button id="theme-all">
				<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/windows_three.png" alt="" style="width: 32px; height: 32px; vertical-align: middle;">
				Theme All
			</button>
			<!--<button id="theme-global">
				<img draggable="false" src="https://win98icons.alexmeub.com/icons/png/windows_update_large-4.png" alt="" style="width: 32px; height: 32px; vertical-align: middle;">
				Set Global Default
			</button>-->
		</div>
	`);
	const select = $theme_test_window.$content.find("#theme-select")[0];
	if (!(select instanceof HTMLSelectElement)) {
		throw new Error("Expected theme select to be an <select> element");
	}
	/** @type {Record<ThemeID, string>} */
	const names = {
		"windows-default": "Windows Default",
		"peggys-pastels": "Peggy's Pastels",
		"blue": "Blue",
	};
	for (const id of /** @type {(ThemeID)[]} */(Object.keys(window_themes))) {
		const option = document.createElement("option");
		option.value = id;
		option.textContent = names[id];
		select.appendChild(option);
	}
	/** @type {ThemeID} */
	let theme_id = "peggys-pastels"; // to contrast the default; otherwise it may appear to do nothing
	select.value = theme_id;
	select.addEventListener("change", () => {
		theme_id = /** @type {ThemeID} */ (select.value);
	});
	$theme_test_window.$content.find("#theme-self").on("click", () => {
		apply_theme_to_el($theme_test_window.element, theme_id);
	});
	$theme_test_window.$content.find("#theme-other").on("click", () => {
		pick_el(".os-window", (other_window_el) => {
			apply_theme_to_el(other_window_el, theme_id);
		}, "Select a window to apply the theme to.");
	});
	$theme_test_window.$content.find("#theme-anything").on("click", () => {
		pick_el("*", (el) => {
			apply_theme_to_el(el, theme_id);
		}, "Select an element to apply the theme to.");
	});
	$theme_test_window.$content.find("#theme-all").on("click", () => {
		for (const theme_point_el of document.querySelectorAll(".theme-point")) {
			apply_theme_to_el(theme_point_el, theme_id, "unset");
		}
		apply_theme_to_el(document.documentElement, theme_id);
	});
	// $theme_test_window.$content.find("#theme-global").on("click", () => {
	// 	apply_theme_to_el(document.documentElement, theme_id);
	// });
	$theme_test_window.focus();
}

/** @typedef {keyof typeof window_themes} ThemeID */
/**
 * @param {Element | null} element
 * @param {ThemeID} theme_id
 * @param {string | undefined} [unset]
 */
function apply_theme_to_el(element, theme_id, unset) {
	const props = Object.assign({},
		window_themes[theme_id],
		renderThemeGraphics(window_themes[theme_id]),
	);
	if (unset) {
		for (const key of Object.keys(props)) {
			props[key] = "";
		}
	}
	applyCSSProperties(props, { element, recurseIntoIframes: true });
	element.classList.add("theme-point");
}

/**
 * Prompts the user to pick an element matching a selector.
 * @param {string} selector
 * @param {(element: Element | null)=> void} callback
 * @param {string} [message]
 */
function pick_el(selector, callback, message = "Select an element.") {
	const $overlay_message = $("<div/>").text(message).css({
		position: "fixed",
		top: 0,
		left: 0,
		width: "100%",
		textAlign: "center",
		fontSize: "2em",
		color: "white",
		backgroundColor: "rgba(0,0,0,0.5)",
		padding: "1em",
		pointerEvents: "none",
	}).append(`<small style='display: block; font-size: 0.6em;'>Press <kbd>Esc</kbd> to cancel.</small>`);
	const $target_overlay = $("<div class='target-overlay'/>").css({
		position: "fixed",
		// backgroundColor: "rgba(255,255,255,0.3)",
		boxSizing: "border-box",
		// outline: "3px dashed black",
		// boxShadow: "0 0 0 2px white, 0 0 0 1px black inset",
		outline: "2px dashed black",
		boxShadow: "0 0 0 2px white, 0 0 0 3px red, 0 0 0 1px red inset",
		// pointerEvents: "none", // we'll use it to block clicks as well as being an indicator
		zIndex: 9999999999,
		// cursor: "crosshair",
		cursor: "pointer",
	}).appendTo("body").hide();
	/** @type {Element | null} */
	let current_el = null;
	const cleanup = () => {
		$overlay_message.remove();
		$target_overlay.remove();
		removeEventListener("keydown", keydown, true);
		removeEventListener("pointermove", pointermove, true);
		removeEventListener("pointerdown", pointerdown, true);
	};
	$target_overlay.on("click", () => {
		cleanup();
		callback(current_el);
	});

	const keydown = (/** @type {KeyboardEvent} */ e) => {
		if (e.key === "Escape") {
			cleanup();
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	};
	const pointermove = (/** @type {PointerEvent} */ e) => {
		const matched_el = document.elementsFromPoint(e.clientX, e.clientY)
			.find((el) => el.matches(selector) && !el.matches(".target-overlay"));
		if (matched_el) {
			current_el = matched_el;
			const rect = matched_el.getBoundingClientRect();
			$target_overlay.css({
				top: rect.top,
				left: rect.left,
				width: rect.width,
				height: rect.height,
			});
			$target_overlay.show();
		} else {
			$target_overlay.hide();
		}
	};
	const pointerdown = (/** @type {PointerEvent} */ e) => {
		e.preventDefault(); // prevent focus change
	};
	addEventListener("keydown", keydown, true);
	addEventListener("pointermove", pointermove, true);
	addEventListener("pointerdown", pointerdown, true);
	$overlay_message.appendTo(document.body);
}

$main_test_window.$content.find("#test-iframes").on("click", test_iframes);
$main_test_window.$content.find("#test-icon-size").on("click", test_icon_sizes);
$main_test_window.$content.find("#test-theme").on("click", test_window_theme);
$main_test_window.$content.find("#test-tabstop-wrapping").on("click", test_tabstop_wrapping);
$main_test_window.$content.find("#test-selection").on("click", test_selectable_text);
$main_test_window.$content.find("#test-triggering").on("click", test_triggering);

const window_themes = {
	"windows-default": {
		"--ActiveBorder": "rgb(192, 192, 192)",
		"--ActiveTitle": "rgb(0, 0, 128)",
		"--AppWorkspace": "rgb(128, 128, 128)",
		"--Background": "rgb(0, 128, 128)",
		"--ButtonAlternateFace": "rgb(180, 180, 180)",
		"--ButtonDkShadow": "rgb(0, 0, 0)",
		"--ButtonFace": "rgb(192, 192, 192)",
		"--ButtonHilight": "rgb(255, 255, 255)",
		"--ButtonLight": "rgb(223, 223, 223)",
		"--ButtonShadow": "rgb(128, 128, 128)",
		"--ButtonText": "rgb(0, 0, 0)",
		"--GradientActiveTitle": "rgb(16, 132, 208)",
		"--GradientInactiveTitle": "rgb(181, 181, 181)",
		"--GrayText": "rgb(128, 128, 128)",
		"--Hilight": "rgb(0, 0, 128)",
		"--HilightText": "rgb(255, 255, 255)",
		"--HotTrackingColor": "rgb(0, 0, 255)",
		"--InactiveBorder": "rgb(192, 192, 192)",
		"--InactiveTitle": "rgb(128, 128, 128)",
		"--InactiveTitleText": "rgb(192, 192, 192)",
		"--InfoText": "rgb(0, 0, 0)",
		"--InfoWindow": "rgb(255, 255, 225)",
		"--Menu": "rgb(192, 192, 192)",
		"--MenuText": "rgb(0, 0, 0)",
		"--Scrollbar": "rgb(192, 192, 192)",
		"--TitleText": "rgb(255, 255, 255)",
		"--Window": "rgb(255, 255, 255)",
		"--WindowFrame": "rgb(0, 0, 0)",
		"--WindowText": "rgb(0, 0, 0)",
	},
	"peggys-pastels": {
		"--Scrollbar": "rgb(250, 224, 228)",
		"--Background": "rgb(162, 219, 210)",
		"--ActiveTitle": "rgb(0, 191, 188)",
		"--InactiveTitle": "rgb(0, 187, 169)",
		"--Menu": "rgb(244, 193, 202)",
		"--Window": "rgb(244, 255, 255)",
		"--WindowFrame": "rgb(0, 0, 0)",
		"--MenuText": "rgb(0, 0, 0)",
		"--WindowText": "rgb(0, 0, 0)",
		"--TitleText": "rgb(255, 255, 255)",
		"--ActiveBorder": "rgb(244, 193, 202)",
		"--InactiveBorder": "rgb(244, 193, 202)",
		"--AppWorkspace": "rgb(255, 184, 182)",
		"--Hilight": "rgb(162, 219, 210)",
		"--HilightText": "rgb(0, 0, 0)",
		"--ButtonFace": "rgb(244, 193, 202)",
		"--ButtonShadow": "rgb(222, 69, 96)",
		"--GrayText": "rgb(222, 69, 96)",
		"--ButtonText": "rgb(0, 0, 0)",
		"--InactiveTitleText": "rgb(0, 85, 77)",
		"--ButtonHilight": "rgb(250, 224, 228)",
		"--ButtonDkShadow": "rgb(64, 64, 64)",
		"--ButtonLight": "rgb(247, 219, 215)",
		"--InfoText": "rgb(0, 0, 0)",
		"--InfoWindow": "rgb(204, 255, 255)",
		"--ButtonAlternateFace": "rgb(181, 181, 181)",
		"--HotTrackingColor": "rgb(0, 128, 128)",
		"--GradientActiveTitle": "rgb(202, 156, 185)",
		"--GradientInactiveTitle": "rgb(236, 145, 162)",
		"--MenuHilight": "rgb(162, 219, 210)",
		"--MenuBar": "rgb(244, 193, 202)",
	},
	"blue": {
		"--ActiveTitle": "rgb(0, 0, 128)",
		"--Background": "rgb(58, 110, 165)",
		"--Hilight": "rgb(51, 153, 255)",
		"--HilightText": "rgb(255, 255, 255)",
		"--TitleText": "rgb(255, 255, 255)",
		"--Window": "rgb(255, 255, 255)",
		"--WindowText": "rgb(0, 0, 0)",
		"--Scrollbar": "rgb(211, 228, 248)",
		"--InactiveTitle": "rgb(49, 131, 221)",
		"--Menu": "rgb(166, 202, 240)",
		"--WindowFrame": "rgb(0, 0, 0)",
		"--MenuText": "rgb(0, 0, 0)",
		"--ActiveBorder": "rgb(166, 202, 240)",
		"--InactiveBorder": "rgb(166, 202, 240)",
		"--AppWorkspace": "rgb(49, 131, 221)",
		"--ButtonFace": "rgb(166, 202, 240)",
		"--ButtonShadow": "rgb(49, 131, 221)",
		"--GrayText": "rgb(49, 131, 221)",
		"--ButtonText": "rgb(0, 0, 0)",
		"--InactiveTitleText": "rgb(0, 0, 128)",
		"--ButtonHilight": "rgb(211, 228, 248)",
		"--ButtonDkShadow": "rgb(0, 0, 0)",
		"--ButtonLight": "rgb(166, 202, 240)",
		"--InfoText": "rgb(0, 0, 0)",
		"--InfoWindow": "rgb(225, 225, 255)",
		"--GradientActiveTitle": "rgb(16, 132, 208)",
		"--GradientInactiveTitle": "rgb(49, 131, 221)",
		"--ButtonAlternateFace": "rgb(192, 192, 192)",
		"--HotTrackingColor": "rgb(0, 0, 128)",
		"--MenuHilight": "rgb(0, 0, 128)",
		"--MenuBar": "rgb(166, 202, 240)",
	},
};

makeBlackToInsetFilter();
