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
	const $menubar = new $MenuBar(menus);
	$menubar.appendTo("#menubar-example");

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

	// Note: the windows are positioned later on to fit into the page layout. See below.

	$("button.toggle").on("click", (e) => {
		$(e.target).toggleClass("selected");
	});

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

	/*applyCSSProperties(parseThemeFileString(`

[Control Panel\\Colors]
ActiveTitle=0 0 128
Background=0 128 128
Hilight=0 0 128
HilightText=255 255 255
TitleText=255 255 255
Window=255 255 255
WindowText=0 0 0
Scrollbar=192 192 192
InactiveTitle=128 128 128
Menu=192 192 192
WindowFrame=0 0 0
MenuText=0 0 0
ActiveBorder=192 192 192
InactiveBorder=192 192 192
AppWorkspace=128 128 128
ButtonFace=192 192 192
ButtonShadow=128 128 128
GrayText=128 128 128
ButtonText=0 0 0
InactiveTitleText=192 192 192
ButtonHilight=255 255 255
ButtonDkShadow=0 0 0
ButtonLight=192 192 192
InfoText=0 0 0
InfoWindow=255 255 225

`));*/
	const $scrollbar_buttons = $(".scrollbar-demo");
	$scrollbar_buttons.after(
		$scrollbar_buttons.clone().css("--scrollbar-size", "15px"),
		$scrollbar_buttons.clone().css("--scrollbar-size", "16px"),
		$scrollbar_buttons.clone().css("--scrollbar-size", "30px"),
		$scrollbar_buttons.clone().css("--scrollbar-size", "50px"),
	);
	$(".scrollbar-demo").each((index, element) => {
		applyCSSProperties(renderThemeGraphics(getComputedStyle(element)), element);
	});

	// position the windows within the demo page, in the flow of text, but freely moveable
	const window_list = [
		[$app_window_1, "app-window-example"],
		[$tool_window_1, "tool-window-example"],
		[$app_window_2, "app-window-2-positioner"],
		[$tool_window_2, "tool-window-2-positioner"],
	];
	for (const [$window, positioning_el_id] of window_list) {
		const $positioning_el = $(`#${positioning_el_id}`);
		$positioning_el.width($window.outerWidth());
		$positioning_el.height($window.outerHeight());
	}
	for (const [$window, positioning_el_id] of window_list) {
		const $positioning_el = $(`#${positioning_el_id}`);
		$window.offset({
			left: $positioning_el.offset().left,
			top: $positioning_el.offset().top
		});

		// $window.appendTo($positioning_el);
		// $window.css({
		// 	position: "relative",
		// 	top: 0,
		// 	left: 0
		// });
	}

	// Users of library: DON'T WORRY ABOUT THIS STUFF
	// This is just for the demo page, to prevent scroll jank when loading the page.
	// This is only needed because of all the dynamic content that is interspersed with text.
	// Usually you would have floating windows, that aren't trying to also fit into a document.
	let static_styles = "";
	for (selector of window_list.map(([, el_id]) => `#${el_id}`).concat([
		"#scrollbar-demos",
		"#menubar-example",
	])) {
		const el = $(selector)[0];
		static_styles += `${selector} { width: ${el.offsetWidth}px; height: ${el.offsetHeight}px; }\n`;
	}
	window.static_styles = static_styles; // export these static styles to the demo's HTML (manually)

});
