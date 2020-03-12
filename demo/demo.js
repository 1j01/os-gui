var show_nothingness = true;
var menus = {
	"&File": [
		{
			item: "&Open",
			action: ()=> {
				alert("\"Open Sesame!\"");
			},
			shortcut: "Ctrl+O",
		},
		MENU_DIVIDER,
		{
			item: "&Brexit",
			action: ()=> {
				alert("Sorry, I'm not informed enough on the topic to make a witty remark.");
			}
		}
	],
	"&View": [
		{
			item: "&Nothingness",
			checkbox: {
				check: ()=> {
					return show_nothingness;
				},
				toggle: ()=> {
					show_nothingness = !show_nothingness;
				}
			}
		},
		{
			item: "&Physics",
			submenu: [
				{
					item: "&Schrödinger's Checkbox",
					checkbox: {
						check: ()=> {
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
			action: ()=> {
				alert("\"Over and out!\"")
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
$(()=> {
	var $menubar = new $MenuBar(menus);
	$menubar.appendTo("#menubar-example");

	var $window = new $Window({title: "Testing 123"});
	$window.$content.append($("#window-example-content"));

	$window.$Button("Open Another Window", ()=> {
		var $new_window = new $Window({title: "Testing Testing 123"});
		$new_window.$content.html("Hey look, a window!");
	});
	$window.on("close", (event)=> {
		event.preventDefault();
	});
	
	// $window.appendTo("#window-example");
	// $window.css({
	// 	position: "relative",
	// 	top: 0,
	// 	left: 0
	// });

	$("#window-example").height($window.height());
	$window.offset({
		left: $("#window-example").offset().left,
		top: $("#window-example").offset().top
	});

	// $("#demo-toggle-button").on("click", (e)=> {
	// 	$(e.target).toggleClass("selected");
	// });

	function loadThemeFile(file) {
		var reader = new FileReader();
		reader.onload = ()=> {
			var fileText = reader.result;

			var cssProperties = parseThemeFileString(fileText);
			applyCSSProperties(cssProperties);
			console.log(makeThemeCSSFile(cssProperties));
		};
		reader.readAsText(file);
	}

	$("html").on("dragover", function(event) {
		event.preventDefault();  
		event.stopPropagation();
	});
	$("html").on("dragleave", function(event) {
		event.preventDefault();  
		event.stopPropagation();
	});
	$("html").on("drop", function(event) {
		event.preventDefault();  
		event.stopPropagation();
		var files = [...event.originalEvent.dataTransfer.files];
		for (var file of files) {
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
	var $scrollbar_buttons = $(".scrollbar-demo");
	$scrollbar_buttons.after(
		$scrollbar_buttons.clone().css("--scrollbar-size", "15px"),
		$scrollbar_buttons.clone().css("--scrollbar-size", "16px"),
		$scrollbar_buttons.clone().css("--scrollbar-size", "30px"),
		$scrollbar_buttons.clone().css("--scrollbar-size", "50px"),
	);
	$(".scrollbar-demo").each((index, element)=> {
		applyCSSProperties(renderThemeGraphics(getComputedStyle(element)), element);
	});

	$window.css({top: $("#window-example").position().top});
});
