var show_nothingness = true;
var menus = {
	"&File": [
		{
			item: "&Open",
			action: ()=> {
				alert("\"Open Sesame!\"");
			}
		},
		$MenuBar.DIVIDER,
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
			}
		},
	]
};
// wait for page load (could alternatively just move the script so it executes after the elements are declared)
$(()=> {
	var $menubar = new $MenuBar(menus);
	$menubar.appendTo("#menubar-example");

	var $window = new $Window({title: "Testing 123"});
	$window.$content.append($("#window-example-content"));

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

	$window.$Button("Open Another Window", ()=> {
		var $window = new $Window({title: "Testing Testing 123"});
		$window.$content.html("Hey look, a window!");
	});
	$window.on("close", (event)=> {
		event.preventDefault();
	});
});
