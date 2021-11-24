(() => {
	// This module allows pixel fonts to render reasonably well in the browser,
	// by wrapping all text in spans, with a sub-pixel offset.
	// Browsers do not support pixel fonts, so a pixel-like vector font is needed.

	// This has a lot of potential for conflicts with other code (CSS and JS),
	// due to assumptions about the DOM structure.

	// Alternatives considered:
	// - Use a single canvas overlay for the page, and draw the text on it.
	//   This would avoid the need for spans, keeping the layout perfectly in tact,
	//   and allow the text to be pixel perfect, without traces of anti-aliasing,
	//   but it would be a huge rabbit hole to implement all the different CSS properties
	//   and layout scenarios that the browser normally handles for you. (Occlusions seem particularly annoying.)
	//   I did a prototype of this here: https://jsfiddle.net/1j01/pdeLx095/
	//   I still used spans for this for measurement (and opacity) but I think it's not needed if I use Range.getClientRects()
	//   and apply opacity to the containing elements instead.
	// - Use one canvas per layer, where a layer is anything that can occlude other things, such as a window or popup menu.
	//   This might be simpler for handling occlusions, I'm not sure, but it has basically the drawbacks of the above.
	// - Use a canvas per text node. Nope nope nope.
	// - Use a canvas per character. Would handle wrapping, but still not various text effects. Terrible for performance.
	// - Implement pixel font support in browsers. Does anyone care?
	// - Rewrite all applications in something other than JavaScript. The web platform sucks. But you know, if it was all webgl or whatever, with emscripten, pixel fonts would be fine.
	// - Convince people that anti-aliased fonts look better. Look how fancy they are.
	// - Convince people Windows 98 used anti-aliased fonts. Look, the option is right there: https://i.imgur.com/UPTFwu3.png

	function textNodesUnder(el) {
		const array = [];
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
		let node;
		while (node = walker.nextNode()) array.push(node);
		return array;
	}

	function render() {
		const text_scale = 1 / window.devicePixelRatio;
		const text_size = 11 * text_scale;
		// document.documentElement.style.setProperty('--text-scale', text_scale);
		// document.documentElement.style.setProperty('--device-pixel-ratio', window.devicePixelRatio);
		const text_nodes = textNodesUnder(document.body);
		for (const text_node of text_nodes) {
			let wrapper = text_node.parentElement.isDynamicWrapper ? text_node.parentElement : null;
			if (!wrapper && (text_node.textContent.trim() !== "") && filter(text_node)) {
				wrapper = document.createElement("span");
				text_node.parentElement.insertBefore(wrapper, text_node.nextSibling);
				wrapper.appendChild(text_node);
				//wrapper.style.display = "inline-table"; // supposedly can help with pixel alignment, but maybe not in the way we need
				wrapper.style.display = "inline";
				wrapper.style.position = "relative";
				wrapper.style.font = "inherit";
				wrapper.style.background = "unset";
				wrapper.style.border = "unset";
				wrapper.style.padding = "unset";
				wrapper.style.margin = "unset";
				// etc. to deal with any CSS not expecting foreign spans to be inserted
            
				wrapper.isDynamicWrapper = true;
				wrapper.className = "text-node-wrapper";
			}
			if (wrapper) {
				wrapper.style.left = "0px";
				wrapper.style.top = "0px";
				wrapper.style.width = "auto";
				wrapper.style.height = "auto";
				// wrapper.style.fontSize = text_scale * 100 + "%";
				// wrapper.style.fontSize = "calc(var(--device-pixel-ratio) * )";
				wrapper.style.fontSize = text_size + "px";
				wrapper.style.fontFamily = `"Pixelated MS Sans Serif", Arial, sans-serif`;

				const rect = wrapper.getBoundingClientRect();
				wrapper.style.left = `${Math.ceil(rect.left) - rect.left}px`;
				wrapper.style.top = `${Math.ceil(rect.top) - rect.top}px`;
				wrapper.style.width = `${Math.ceil(rect.width)}px`;
				wrapper.style.height = `${Math.ceil(rect.height)}px`;
			}
		}
	}

	function filter(text_node) {
		return (
			text_node.parentElement.tagName !== "STYLE" &&
			text_node.parentElement.tagName !== "SCRIPT" &&
			//text_node.parentElement.tagName !== "TITLE" &&
			text_node.parentElement.closest(".menus, .menu-popup, .os-window")
		);
		// !text_node.parentElement.closest("h1,h2,h3,h4,h5,h6,pre,code,blockquote,ul,ol,li,table,tr,td,th,thead,tbody,tfoot,dl,dt,dd,figure,figcaption,svg,script,style,title,nav,footer,header");
	}

	var observer = new MutationObserver(render);
	observer.observe(document.body, { childList: true, subtree: true, attributes: false, characterData: true });

	render();
	window.addEventListener("load", render);
	window.addEventListener('resize', render);
	// document.addEventListener('selectionchange', render);
	// document.addEventListener('scroll', render);

})();
