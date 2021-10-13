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
	for (const control_html of [
		"<input type='text'/>",
		"<input type='radio'/>",
		"<input type='checkbox'/>",
		"<select></select>",
		"<textarea></textarea>",
		"<button></button>",
		"<a href='#'>link</a>",
		"<div>wild card</div>", // not a control :)
		"<div tabIndex='-1'>tabIndex=-1</div>",
		"<div tabIndex='0'>tabIndex=0</div>",
	]) {
		const $w = $Window({ title: "Tabstop Wrapping", resizable: false, maximizeButton: false, minimizeButton: false });
		$w.$content.html(control_html + "yaddah yaddah" + control_html);
		$w.css({left: x += 150, top: 400});
	}
	e.preventDefault(); // hack
});

// todo: test <label> surrounding or not surrounding <input>
// test hidden controls, disabled controls

