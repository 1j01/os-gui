let nothingness_state = true;
const menus = {
	"&File": [
		{
			item: "&Open",
			action: () => {
				const $w = $Window({ title: "Ali Baba and the Forty Thieves", resizable: false, maximizeButton: false, minimizeButton: false });
				$w.$content.html("<p>\"Open Sesame!\"</p>");
				$w.$Button("OK", () => $w.close()).focus().css({ width: 100 });
				$w.center();
			},
			shortcut: "Ctrl+O",
			description: "Shows a silly dialog box.",
		},
		MENU_DIVIDER,
		{
			item: "&Brexit",
			action: () => {
				const $w = $Window({ title: "Membership Status", resizable: false, maximizeButton: false, minimizeButton: false });
				$w.$content.html("<p>You have left the EU.</p>");
				$w.$Button("OK", () => $w.close()).focus().css({ width: 100 });
				$w.center();
			},
			description: "Shows a stupid dialog box.",
		}
	],
	"&View": [
		{
			item: "&Nothingness",
			checkbox: {
				check: () => nothingness_state,
				toggle: () => {
					nothingness_state = !nothingness_state;
				}
			},
			description: "Tick a meaningless checkbox.",
		},
		{
			item: "&Physics",
			submenu: [
				{
					item: "&Schrödinger's Checkbox",
					checkbox: {
						check: () => {
							// this.cat_is_alive = this.cat_is_alive ?? Math.random() > 0.5;
							// return this.cat_is_alive;
							return Math.random() > 0.5;
						}
					},
					description: "The checked state is indeterminate until observed.",
				},
			],
			description: "Contains a stupid physics joke.",
		},
		{
			item: "&Many Items",
			submenu: new Array(100).fill(0).map((_, i) => ({
				item: `Item ${i}`,
				checkbox: {
					check: function () {
						this.pointless_checkbox_value = this.pointless_checkbox_value ?? Math.sin((i / 5) ** 2) > 0;
						return this.pointless_checkbox_value;
					},
					toggle: function () { this.pointless_checkbox_value = !this.pointless_checkbox_value; }
				},
				shortcut: `Ctrl+${i}`,
			})),
			description: "Contains lots of items.",
		},
	],
	"&Edit": [
		{
			item: "Copy",
			action: () => {
				const $w = $Window({ title: "Radio Message", resizable: false, maximizeButton: false, minimizeButton: false });
				$w.$content.html("<p>\"Over and out!\"</p>");
				$w.$Button("OK", () => $w.close()).focus().css({ width: 100 });
				$w.center();
			},
			shortcut: "Ctrl+C",
			description: "Shows a pointless dialog.",
		},
		{
			item: "Paste",
			enabled: false,
			shortcut: "Ctrl+V",
			description: "This menu item is disabled.",
		},
	],
};
// wait for page load (could alternatively just move the script so it executes after the elements are declared)
$(() => {
	// Create menu bar
	const menubar = new MenuBar(menus);
	$(menubar.element).appendTo("#menubar-example");

	// Create demo windows
	const $app_window_1 = new $Window({ title: "Application Window", resizable: true });
	$app_window_1.$content.append(`
		<p>This is a window that can be moved around and resized.</p>
	`);
	fake_closing($app_window_1);

	const $tool_window_1 = new $Window({ title: "Tool Window", toolWindow: true });
	$tool_window_1.$content.text("This is a tool window.");
	fake_closing($tool_window_1);

	const $app_window_2 = new $Window({ title: "Application Example", resizable: true });
	const app_window_2_menu_bar = new MenuBar(menus);
	$app_window_2.setMenuBar(app_window_2_menu_bar);
	$app_window_2.$content.css({
		padding: 0,
		display: "flex",
		flexDirection: "column",
	});
	$app_window_2.$content.append(`
		<div class="inset-deep" style="padding: 20px; background: var(--Window); color: var(--WindowText); user-select: text; cursor: text; flex: 1;">
			<p>This is the main application window.</p>
			<p>It has a tool window that belongs to it, as well as a menu bar.</p>
		</div>
	`);
	const $status_bar = $("<div class='status-bar inset-shallow' style='height:1.5em;line-height:1.5em;font-size:12px;margin-top:2px;'>").appendTo($app_window_2.$content);
	$(app_window_2_menu_bar.element).on("info", (event, info) => {
		// info = `event.detail.description: ${event.detail.description}, jQuery second arg: ${info}`; // testing
		info = event.detail.description; // new API
		$status_bar.text(info);
	});
	function showDefaultStatus() {
		$status_bar.text("I am a status bar. This is my default text.");
	}
	showDefaultStatus();
	$(app_window_2_menu_bar.element).on("default-info", (event) => {
		showDefaultStatus();
	});
	fake_closing($app_window_2);
	const $tool_window_2 = new $Window({ title: "Tool Window", toolWindow: true, parentWindow: $app_window_2 });
	$tool_window_2.$content.text("This tool window is a child of the app window.");
	fake_closing($tool_window_2);
	$app_window_2.on("closed", () => {
		$tool_window_2.close();
	});

	const $app_window_3 = new $Window({ title: "Right-To-Left Example", resizable: true });
	$app_window_3.css("direction", "rtl");
	$app_window_3.setMenuBar(new MenuBar(menus));
	$app_window_3.$content.css({
		padding: 0,
		display: "flex",
		flexDirection: "column",
	});
	$app_window_3.$content.append(`
		<div style='padding: 20px; background: var(--Window); color: var(--WindowText); user-select: text; cursor: text; flex: 1;'>
			<p dir="ltr">You can imagine some Hebrew/Arabic/etc. text in the menus and titlebar.</p>
		</div>
	`);
	fake_closing($app_window_3);

	// Position the windows within the demo page, in the flow of text, but freely moveable
	const $windows_and_$positioners = [
		[$app_window_1, $("#app-window-example")],
		[$tool_window_1, $("#tool-window-example")],
		[$app_window_2, $("#app-window-2-positioner")],
		[$tool_window_2, $("#tool-window-2-positioner")],
		[$app_window_3, $("#app-window-3-positioner")],
	];
	function position_windows() {
		for (const [$window, $positioning_el] of $windows_and_$positioners) {
			// in a separate loop to prevent layout thrashing (untested performance optimization)
			$positioning_el._new_offset = $positioning_el.offset();
		}
		for (const [$window, $positioning_el] of $windows_and_$positioners) {
			const { _new_offset, _old_offset } = $positioning_el;
			if (
				_new_offset.top !== _old_offset?.top ||
				_new_offset.left !== _old_offset?.left
			) {
				$window.restore(); // in case it was minimized or maximized
				$window.css({
					left: _new_offset.left,
					top: _new_offset.top,
					width: "",
					height: "",
				});
				$positioning_el._old_offset = _new_offset;
			}
		}
	}
	$(window).on("resize", position_windows);
	position_windows();

	// Fake closing the windows (hide and fade back in), for demo purposes
	function fake_closing($window) {
		$window.on("close", (event) => {
			event.preventDefault();
			$window.triggerHandler("closed");
			$window.closed = true;
			$window.hide();
			setTimeout(() => {
				// Restore position
				const $positioning_el = $windows_and_$positioners.find(([$other_window]) => $window === $other_window)[1];
				$window.restore(); // in case it was minimized or maximized
				$window.css({
					left: $positioning_el.offset().left,
					top: $positioning_el.offset().top,
					width: "",
					height: "",
				});
				// Fade back in
				$window.fadeIn();
				// Ta-da! It was there all along!
				$window.closed = false;
			}, 1000);
		});
	}

	// Handle toggle buttons
	$("button.toggle").on("click", (e) => {
		$(e.target).toggleClass("selected");
		$(e.target).attr("aria-pressed", $(e.target).hasClass("selected"));
	});

	// Load themes on drag and drop (.theme/.themepack files)
	async function loadThemeFile(file) {
		const fileText = await file.text();
		const cssProperties = parseThemeFileString(fileText);
		if (cssProperties) {
			applyCSSProperties(cssProperties, { recurseIntoIframes: true });
			console.log(makeThemeCSSFile(cssProperties));
		}
	}
	$("html").on("dragover", (event) => {
		event.preventDefault();
		event.stopPropagation();
	});
	$("html").on("dragleave", (event) => {
		event.preventDefault();
		event.stopPropagation();
	});
	$("html").on("drop", (event) => {
		event.preventDefault();
		event.stopPropagation();
		const files = [...event.originalEvent.dataTransfer.files];
		for (const file of files) {
			if (file.name.match(/\.theme(pack)?$/i)) {
				loadThemeFile(file);
			}
		}
	});

	// Generate variations of scrollbars
	const $scrollbar_buttons = $(".scrollbar-demo");
	$scrollbar_buttons.after(
		$scrollbar_buttons.clone().css("--scrollbar-size", "15px"),
		$scrollbar_buttons.clone().css("--scrollbar-size", "16px"),
		$scrollbar_buttons.clone().css("--scrollbar-size", "30px"),
	);
	$(".scrollbar-demo").each((index, element) => {
		applyCSSProperties(renderThemeGraphics(getComputedStyle(element)), { element });
	});
});
