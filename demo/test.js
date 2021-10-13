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

// $('#full-height-checkbox').change(function () {
// 	console.log('full-height changed');
// 	$('body, html').css('height', this.checked ? '100%' : '');
// }).trigger('change');

const $app_window_1 = new $Window({ title: "Application Window", resizable: true });
$app_window_1.$content.append(`
	<p>This is a window that can be moved around and resized.</p>
`);
const $tool_window_1 = new $Window({ title: "Tool Window", toolWindow: true });
$tool_window_1.$content.text("This is a tool window.");
$app_window_1.$Button("Open Dialog", (e) => {
	const $w = $Window({ title: "Talk Up", resizable: false, maximizeButton: false, minimizeButton: false });
	$w.$content.html("<p>Let's have an honest dialog.</p>");
	$w.$Button("OK", () => $w.close()).focus().css({ width: 100 });
	e.preventDefault(); // kinda works even though it's an error haha... the error prevents code from running that closes the window
});

// Test tabstop wrapping by creating many windows with different types of controls.
$app_window_1.$Button("Test Tabstop Wrapping", (e) => {
	let x = 0;
	let y = 300;
	const w = 200;
	const h = 200;
	for (const control_html of [
		"<input type='text'/>",
		"<input type='radio'/>(no name, pointless)",
		"<input type='radio' name='radio-group-0'/>(named group of 1, pointless)",
		"<input type='radio' name='radio-group-1'/><input type='radio' name='radio-group-1'/>(named group of 2)",
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
	e.preventDefault(); // hack
});

// Radio buttons should be treated as a group with one tabstop.
// If there's no selected ("checked") radio, it should still visit the group,
// but if there is a selected radio in the group, it should skip all unselected radios in the group.

// todo: test <label> surrounding or not surrounding <input> (do labels even factor in to tabstop wrapping?)
// test hidden controls, disabled controls

