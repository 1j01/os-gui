(function (exports) {
	console?.warn?.("$MenuBar.js is deprecated. Please use MenuBar.js instead. jQuery is no longer required for menu bars. For upgrading, see https://github.com/1j01/os-gui/blob/master/CHANGELOG.md");

	// const script = document.createElement('script');
	// script.src = document.currentScript.src.replace("$", "");
	// document.head.appendChild(script);

	var xhr = new XMLHttpRequest();
	// @ts-ignore
	xhr.open("GET", document.currentScript.src.replace("$", ""), false);
	xhr.send();
	eval(xhr.responseText);
	
	/** @param {OSGUIMenuFragment[]} menus */
	function $MenuBar(menus) {
		console?.warn?.("$MenuBar is deprecated. Use `new MenuBar(menus).element` instead.");
		return jQuery(MenuBar(menus).element);
	}

	exports.$MenuBar = $MenuBar;
})(window);
