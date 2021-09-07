let nothingness_state = true;
const menus = {
	"&File": [
		{
			item: "&Open",
			action: () => {
				const $w = $Window({ title: "Ali Baba and the Forty Thieves", resizable: false, maximizeButton: false, minimizeButton: false });
				$w.$content.html("<p>\"Open Sesame!\"</p>");
				$w.$Button("OK", () => $w.close()).focus().css({ width: 100 });
			},
			shortcut: "Ctrl+O",
		},
		MENU_DIVIDER,
		{
			item: "&Brexit",
			action: () => {
				const $w = $Window({ title: "Membership Status", resizable: false, maximizeButton: false, minimizeButton: false });
				$w.$content.html("<p>You have left the EU.</p>");
				$w.$Button("OK", () => $w.close()).focus().css({ width: 100 });
			}
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
			}
		},
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
	],
	"&Edit": [
		{
			item: "Copy",
			action: () => {
				const $w = $Window({ title: "Radio Message", resizable: false, maximizeButton: false, minimizeButton: false });
				$w.$content.html("<p>\"Over and out!\"</p>");
				$w.$Button("OK", () => $w.close()).focus().css({ width: 100 });
			},
			shortcut: "Ctrl+C",
		},
		{
			item: "Paste",
			enabled: false,
			shortcut: "Ctrl+V",
		},
	]
};
// wait for page load (could alternatively just move the script so it executes after the elements are declared)
$(() => {
	// Create menu bar
	const $menubar = new $MenuBar(menus);
	$menubar.appendTo("#menubar-example");

	// Create demo windows
	const $app_window_1 = new $Window({ title: "Application Window", resizable: true });
	$app_window_1.$content.append($("#app-window-example-content").attr("hidden", null));

	$app_window_1.$Button("Open Another Window", () => {
		const $new_window = new $Window({ title: "Testing, Testing, 123" });
		$new_window.$content.html("Hey look, a window!");
	});
	$app_window_1.on("close", (event) => {
		event.preventDefault();
	});

	const $tool_window_1 = new $Window({ title: "Tool Window", toolWindow: true });
	$tool_window_1.$content.append($("#tool-window-example-content").attr("hidden", null));
	$tool_window_1.on("close", (event) => {
		event.preventDefault();
	});

	const $app_window_2 = new $Window({ title: "Application Example", resizable: true });
	$app_window_2.$content.prepend(new $MenuBar(menus));
	$app_window_2.$content.css({
		padding: 0,
		display: "flex",
		flexDirection: "column",
	});
	$app_window_2.$content.append(`
		<div style='padding: 20px; background: var(--Window); color: var(--WindowText); user-select: text; cursor: text; flex: 1;'>
			<p>This is the main application window.</p>
			<p>It has a tool window that belongs to it, as well as a menu bar.</p>
		</div>
	`);
	const $tool_window_2 = new $Window({ title: "Tool Window", toolWindow: true, parentWindow: $app_window_2 });
	$tool_window_2.$content.text("This tool window is a child of the app window.");

	// Position the windows within the demo page, in the flow of text, but freely moveable
	const window_list = [
		[$app_window_1, "app-window-example"],
		[$tool_window_1, "tool-window-example"],
		[$app_window_2, "app-window-2-positioner"],
		[$tool_window_2, "tool-window-2-positioner"],
	];
	for (const [$window, positioning_el_id] of window_list) {
		const $positioning_el = $(`#${positioning_el_id}`);
		$window.offset({
			left: $positioning_el.offset().left,
			top: $positioning_el.offset().top
		});
	}

	// Handle toggle buttons
	$("button.toggle").on("click", (e) => {
		$(e.target).toggleClass("selected");
	});

	// Load themes on drag and drop (.theme/.themepack files)
	async function loadThemeFile(file) {
		const fileText = await file.text();
		const cssProperties = parseThemeFileString(fileText);
		if (cssProperties) {
			applyCSSProperties(cssProperties);
			console.log(makeThemeCSSFile(cssProperties));
		}
	}
	$("html").on("dragover", (event)=> {
		event.preventDefault();
		event.stopPropagation();
	});
	$("html").on("dragleave", (event)=> {
		event.preventDefault();
		event.stopPropagation();
	});
	$("html").on("drop", (event)=> {
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
		applyCSSProperties(renderThemeGraphics(getComputedStyle(element)), element);
	});
});
