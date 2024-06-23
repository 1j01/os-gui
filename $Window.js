((exports) => {

const deprecatedEvents = {
	// "window-drag-start": "onBeforeDrag", // TODO: implement
	// "title-change": "onTitleChanged", // TODO: implement
	// "icon-change": "onIconChanged", // TODO: implement
	"close": "onBeforeClose",
	"closed": "onClosed",
};
// @ts-ignore (not part of the public jQuery API)
const originalAdd = jQuery.event.add;
// @ts-ignore (not part of the public jQuery API, but I'm taking care that it shouldn't break if the signature changes)
jQuery.event.add = function (elem, types, ...otherArgs) {
	if (typeof types === "string") {
		for (const type of types.split(" ")) {
			// Don't warn about native "close" event of <dialog> elements
			if (type in deprecatedEvents && $(elem).is(".window")) {
				const replacementMethod = deprecatedEvents[/** @type {keyof typeof deprecatedEvents} */(type)];
				if (replacementMethod) {
					console.trace(`DEPRECATED: use $window.${replacementMethod}(listener) instead of adding a jQuery event listener for "${types}"`);
				}
			}
		}
	}
	originalAdd(elem, types, ...otherArgs);
};

// TODO: E\("([a-z]+)"\) -> "<$1>" or get rid of jQuery as a dependency

const E = document.createElement.bind(document);

/**
 * @param {Element | object | null | undefined} element 
 * @returns {string}
 */
function element_to_string(element) {
	// returns a CSS-selector-like string for the given element
	// if (element instanceof Element) { // doesn't work with different window.Element from iframes
	if (element && typeof element === "object" && "tagName" in element) {
		return element.tagName.toLowerCase() +
			(element.id ? "#" + element.id : "") +
			(element.className ? "." + element.className.split(" ").join(".") : "") +
			// @ts-ignore (duck typing is better here for cross-iframe code)
			(element.src ? `[src="${element.src}"]` : "") + // Note: not escaped; may not actually work as a selector (but this is for debugging)
			// @ts-ignore (duck typing is better here for cross-iframe code)
			(element.srcdoc ? "[srcdoc]" : "") + // (srcdoc can be long)
			// @ts-ignore (duck typing is better here for cross-iframe code)
			(element.href ? `[href="${element.href}"]` : "");
	} else if (element) {
		return element.constructor.name;
	} else {
		return `${element}`;
	}
}

/**
 * @param {Node | Window} node
 * @returns {node is HTMLIFrameElement}
 */
function is_iframe(node) {
	// return node.tagName == "IFRAME"; // not ideal since it would check for a global named "tagName" in the case of the Window object
	// return node instanceof HTMLIFrameElement; // not safe across iframe contexts, since each iframe has its own window.HTMLIFrameElement
	return node instanceof node.ownerDocument.defaultView.HTMLIFrameElement;
}

/**
 * @param {Node} node
 * @returns {node is HTMLInputElement}
 */
function is_input(node) {
	return node.nodeName.toLowerCase() === "input";
}

/**
 * @param {Element} container_el
 * @returns {JQuery<HTMLElement>}
 */
function find_tabstops(container_el) {
	const $el = $(container_el);
	// This function finds focusable controls, but not necessarily all of them;
	// for radio elements, it only gives one: either the checked one, or the first one if none are checked.

	// Note: for audio[controls], Chrome at least has two tabstops (the audio element and three dots menu button).
	// It might be possible to detect this in the shadow DOM, I don't know, I haven't worked with the shadow DOM.
	// But it might be more reliable to make a dummy tabstop element to detect when you tab out of the first/last element.
	// Also for iframes!
	// Assuming that doesn't mess with screen readers.
	// Right now you can't tab to the three dots menu if it's the last element.
	// @TODO: see what ally.js does. Does it handle audio[controls]? https://allyjs.io/api/query/tabsequence.html

	let $controls = $el.find(`
		input:enabled,
		textarea:enabled,
		select:enabled,
		button:enabled,
		a[href],
		[tabIndex='0'],
		details summary,
		iframe,
		object,
		embed,
		video[controls],
		audio[controls],
		[contenteditable]:not([contenteditable='false'])
	`).filter(":visible");
	// const $controls = $el.find(":tabbable"); // https://api.jqueryui.com/tabbable-selector/

	// Radio buttons should be treated as a group with one tabstop.
	// If there's no selected ("checked") radio, it should still visit the group,
	// but if there is a selected radio in the group, it should skip all unselected radios in the group.
	/** @type {Record<string, HTMLElement>} */
	const radios = {}; // best radio found so far, per group
	/** @type {HTMLElement[]} */
	const to_skip = [];
	for (const el of $controls.toArray()) {
		if (is_input(el) && el.type === "radio") {
			if (radios[el.name]) {
				if (el.checked) {
					to_skip.push(radios[el.name]);
					radios[el.name] = el;
				} else {
					to_skip.push(el);
				}
			} else {
				radios[el.name] = el;
			}
		}
	}
	const $tabstops = $controls.not(to_skip);
	// debug viz:
	// $tabstops.css({boxShadow: "0 0 2px 2px green"});
	// $(to_skip).css({boxShadow: "0 0 2px 2px gray"})
	return $tabstops;
}
var $G = $(window);


$Window.Z_INDEX = 5;

/** @type {(OSGUIWindow | null)[]} */
var minimize_slots = []; // for if there's no taskbar

function formatPropertyAccess(/** @type {string | symbol} */ prop) {
	if (typeof prop === "symbol") {
		return `[${String(prop)}]`;
	} else if (/^\d+$/.test(prop)) {
		return `[${prop}]`;
	} else if (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(prop)) {
		return `.${prop}`;
	} else {
		return `[${JSON.stringify(prop)}]`;
	}
}

// @TODO: make this a class,
// instead of a weird pseudo-class
/**
 * @param {OSGUIWindowOptions} [options]
 * @returns {OSGUI$Window}
 */
function $Window(options = {}) {
	// @TODO: handle all option defaults here
	// and validate options.

	// WOW, this is ugly. It's kind of impressive, almost.
	/** @type {OSGUIWindow} */
	var win = {};
	// TODO: A $Window.fromElement (or similar) static method using a Map would be better for type checking.
	// @ts-ignore
	win.element = E("div");
	/** @type {JQuery<HTMLElement>} */
	var $window_element = $(win.element);

	/** @type {OSGUI$Window} */
	// @ts-ignore
	var $win = new Proxy(win, {
		get: function (_target, name) {
			if (name in win) {
				// @ts-ignore
				return win[name];
			} else if (name in $window_element) {
				// @ts-ignore
				if (/^0$/.test(name)) {
					console.trace(`DEPRECATED: use $window.element instead of $window[0].`);
				// @ts-ignore
				} else if (/^first|last|get$/.test(name)) {
					// Assuming 0 will be the argument since a $Window shouldn't have multiple elements.
					console.trace(`DEPRECATED: use $window.element instead of $window${formatPropertyAccess(name)}(0).`);
				} else if (name === "find") {
					console.trace(`DEPRECATED: use $window.$content.find instead of $window.find, if possible; otherwise use $($window.element).find for a direct equivalent.`);
				} else {
					const accessor = formatPropertyAccess(name);
					console.trace(`DEPRECATED: use $($window.element)${accessor} instead of $window${accessor} directly. Eventually jQuery will be removed from the library.`);
				}
				// @ts-ignore
				if (typeof $window_element[name] === "function") {
					// @ts-ignore
					return $window_element[name].bind($window_element);
				}
				// @ts-ignore
				return $window_element[name];
			} else {
				// Allow duck typing, as, for instance, jQuery checks for `object.window`
				// and arbitrarily added properties.
				// console.trace("Unknown property", name);
			}
		},
		set: function (_target, name, value) {
			if (name in win) {
				// @ts-ignore
				win[name] = value;
			} else if (name in $window_element) {
				const accessor = formatPropertyAccess(name);
				console.trace(`DEPRECATED: use $($window.element)${accessor} instead of $window${accessor} directly.`);
				// @ts-ignore
				$window_element[name] = value;
			} else {
				// Allow adding arbitrary properties (though it's not recommended).
				// console.trace("Unknown property", name);
			}
			return true;
		}
	});

	win.element.$window = $win;
	win.element.classList.add("window", "os-window");
	win.element.id = `os-window-${Math.random().toString(36).substr(2, 9)}`;

	document.body.appendChild(win.element);

	win.$titlebar = $(E("div")).addClass("window-titlebar").appendTo($window_element);
	win.$title_area = $(E("div")).addClass("window-title-area").appendTo(win.$titlebar);
	win.$title = $(E("span")).addClass("window-title").appendTo(win.$title_area);
	if (options.toolWindow) {
		options.minimizeButton = false;
		options.maximizeButton = false;
	}
	if (options.minimizeButton !== false) {
		win.$minimize = $(E("button")).addClass("window-minimize-button window-action-minimize window-button").appendTo(win.$titlebar);
		win.$minimize.attr("aria-label", "Minimize window"); // @TODO: for taskbarless minimized windows, "restore"
		win.$minimize.append("<span class='window-button-icon'></span>");
	}
	if (options.maximizeButton !== false) {
		win.$maximize = $(E("button")).addClass("window-maximize-button window-action-maximize window-button").appendTo(win.$titlebar);
		win.$maximize.attr("aria-label", "Maximize or restore window"); // @TODO: specific text for the state
		if (!options.resizable) {
			win.$maximize.prop("disabled", true);
		}
		win.$maximize.append("<span class='window-button-icon'></span>");
	}
	if (options.closeButton !== false) {
		win.$x = $(E("button")).addClass("window-close-button window-action-close window-button").appendTo(win.$titlebar);
		win.$x.attr("aria-label", "Close window");
		win.$x.append("<span class='window-button-icon'></span>");
	}
	win.$content = $(E("div")).addClass("window-content").appendTo($window_element);
	win.$content.attr("tabIndex", "-1");
	win.$content.css("outline", "none");
	if (options.toolWindow) {
		$window_element.addClass("tool-window");
	}
	if (options.parentWindow) {
		options.parentWindow.addChildWindow($win);
		// semantic parent logic is currently only suited for tool windows
		// for dialog windows, it would make the dialog window not show as focused
		// (alternatively, I could simply, when following the semantic parent chain, look for windows that are not tool windows)
		if (options.toolWindow) {
			win.element.dataset.semanticParent = options.parentWindow.element.id;
		}
	}

	var $component = options.$component;
	if (typeof options.icon === "object" && "tagName" in options.icon) {
		options.icons = { any: options.icon };
	} else if (options.icon) {
		// old terrible API using globals that you have to define
		console.warn("DEPRECATED: use options.icons instead of options.icon, e.g. new $Window({icons: {16: 'app-16x16.png', any: 'app-icon.svg'}})");
		// @ts-ignore
		if (typeof $Icon !== "undefined" && typeof TITLEBAR_ICON_SIZE !== "undefined") {
			// @ts-ignore
			win.icon_name = options.icon;
			// @ts-ignore
			win.$icon = $Icon(options.icon, TITLEBAR_ICON_SIZE).prependTo(win.$titlebar);
		} else {
			throw new Error("Use {icon: img_element} or {icons: {16: url_or_img_element}} options");
		}
	}
	win.icons = options.icons || {};
	let iconSize = 16;
	win.setTitlebarIconSize = function (target_icon_size) {
		if (win.icons) {
			win.$icon?.remove();
			const iconNode = win.getIconAtSize(target_icon_size);
			win.$icon = iconNode ? $(iconNode) : $();
			win.$icon.prependTo(win.$titlebar);
		}
		iconSize = target_icon_size;
		$window_element.trigger("icon-change");
	};
	win.getTitlebarIconSize = function () {
		return iconSize;
	};
	// @TODO: this could be a static method, like OSGUI.getIconAtSize(icons, targetSize)
	win.getIconAtSize = function (target_icon_size) {
		let icon_size;
		if (win.icons[target_icon_size]) {
			icon_size = target_icon_size;
		} else if (win.icons["any"]) {
			icon_size = "any";
		} else {
			// isFinite(parseFloat("123xyz")) // true
			// isFinite("123xyz") // false
			// isFinite(parseFloat(null)) // false
			// isFinite(null) // true
			// @ts-ignore
			const sizes = Object.keys(win.icons).filter(size => isFinite(size) && isFinite(parseFloat(size)));
			sizes.sort((a, b) => Math.abs(parseFloat(a) - target_icon_size) - Math.abs(parseFloat(b) - target_icon_size));
			icon_size = sizes[0];
		}
		if (icon_size) {
			const icon = win.icons[icon_size];
			let icon_element;
			if (typeof icon === "object" && "cloneNode" in icon) {
				icon_element = icon.cloneNode(true);
			} else {
				icon_element = E("img");
				const $icon = $(icon_element);
				if (typeof icon === "string") {
					$icon.attr("src", icon);
				} else if ("srcset" in icon) {
					$icon.attr("srcset", icon.srcset);
				} else {
					$icon.attr("src", icon.src);
				}
				$icon.attr({
					width: icon_size,
					height: icon_size,
					draggable: false,
				});
				$icon.css({
					width: target_icon_size,
					height: target_icon_size,
				});
			}
			return icon_element;
		}
		return null;
	};
	// @TODO: automatically update icon size based on theme (with a CSS variable)
	win.setTitlebarIconSize(iconSize);

	win.getIconName = () => {
		console.warn("DEPRECATED: use $w.icons object instead of $w.icon_name");
		return win.icon_name;
	};
	win.setIconByID = (icon_name) => {
		console.warn("DEPRECATED: use $w.setIcons(icons) instead of $w.setIconByID(icon_name)");
		var old_$icon = win.$icon;
		// @ts-ignore
		win.$icon = $Icon(icon_name, TITLEBAR_ICON_SIZE);
		old_$icon.replaceWith(win.$icon);
		win.icon_name = icon_name;
		win.task?.updateIcon();
		$window_element.trigger("icon-change");
		return win;
	};
	win.setIcons = (icons) => {
		win.icons = icons;
		win.setTitlebarIconSize(iconSize);
		win.task?.updateIcon();
		// icon-change already sent by setTitlebarIconSize
	};

	if ($component) {
		$window_element.addClass("component-window");
	}

	setTimeout(() => {
		if (get_direction() == "rtl") {
			$window_element.addClass("rtl"); // for reversing the titlebar gradient
		}
	}, 0);

	/**
	 * @returns {"ltr" | "rtl"} writing/layout direction
	 */
	function get_direction() {
		return window.get_direction ? window.get_direction() : /** @type {"ltr" | "rtl"} */(getComputedStyle(win.element).direction);
	}

	/**
	 * @template {any[]} ArgsType
	 * @param {string} name
	 * @returns {[(callback: (...args: ArgsType) => void) => (() => void), (...args: ArgsType) => void]} [add_listener, trigger]
	 */
	const make_simple_listenable = (name) => {
		/** @type {((...args: ArgsType) => void)[]} */
		let event_handlers = [];

		const add_listener = (/** @type {(...args: ArgsType) => void} */ callback) => {
			event_handlers.push(callback);

			const dispose = () => {
				event_handlers = event_handlers.filter(handler => handler !== callback);
			};

			return dispose;
		};

		/**
		 * @param {ArgsType} args
		 */
		const trigger = (...args) => {
			for (const handler of event_handlers) {
				handler(...args);
			}
		};
		// return Object.assign(add_listener, { trigger });
		return [add_listener, trigger];
	};

	/** @type {[typeof win.onFocus, () => void]} */
	const [onFocus, dispatch_focus] = make_simple_listenable("focus");
	/** @type {[typeof win.onBlur, () => void]} */
	const [onBlur, dispatch_blur] = make_simple_listenable("blur");
	/** @type {[typeof win.onClosed, () => void]} */
	const [onClosed, dispatch_closed] = make_simple_listenable("closed");
	/** @type {[typeof win.onBeforeClose, (event: {preventDefault: () => void}) => void]} */
	const [onBeforeClose, dispatch_before_close] = make_simple_listenable("close");
	/** @type {[typeof win.onBeforeDrag, (event: {preventDefault: () => void}) => void]} */
	const [onBeforeDrag, dispatch_before_drag] = make_simple_listenable("window-drag-start");

	Object.assign(win, { onFocus, onBlur, onClosed, onBeforeClose, onBeforeDrag });

	/**
	 * @param {{ innerWidth?: number, innerHeight?: number, outerWidth?: number, outerHeight?: number }} options
	 */
	win.setDimensions = ({ innerWidth, innerHeight, outerWidth, outerHeight }) => {
		let width_from_frame, height_from_frame;
		// It's good practice to make all measurements first, then update the DOM.
		// Once you update the DOM, the browser has to recalculate layout, which can be slow.
		if (innerWidth) {
			width_from_frame = $window_element.outerWidth() - win.$content.outerWidth();
		}
		if (innerHeight) {
			height_from_frame = $window_element.outerHeight() - win.$content.outerHeight();
			const $menu_bar = win.$content.find(".menus"); // only if inside .content; might move to a slot outside .content later
			if ($menu_bar.length) {
				// maybe this isn't technically part of the frame, per se? but it's part of the non-client area, which is what I technically mean.
				height_from_frame += $menu_bar.outerHeight();
			}
		}
		if (outerWidth) {
			$window_element.outerWidth(outerWidth);
		}
		if (outerHeight) {
			$window_element.outerHeight(outerHeight);
		}
		if (innerWidth) {
			$window_element.outerWidth(innerWidth + width_from_frame);
		}
		if (innerHeight) {
			$window_element.outerHeight(innerHeight + height_from_frame);
		}
	};
	win.setDimensions(options);

	/** @type {OSGUI$Window[]} */
	let child_$windows = [];
	win.addChildWindow = ($child_window) => {
		child_$windows.push($child_window);
	};
	const showAsFocused = () => {
		if ($window_element.hasClass("focused")) {
			return;
		}
		$window_element.addClass("focused");
		dispatch_focus();
	};
	const stopShowingAsFocused = () => {
		if (!$window_element.hasClass("focused")) {
			return;
		}
		$window_element.removeClass("focused");
		dispatch_blur();
	};
	win.focus = () => {
		// showAsFocused();
		win.bringToFront();
		refocus();
	};
	win.blur = () => {
		stopShowingAsFocused();
		if (document.activeElement && document.activeElement.closest(".window") == win.element) {
			document.activeElement.blur();
		}
	};

	if (options.toolWindow) {
		if (options.parentWindow) {
			options.parentWindow.onFocus(showAsFocused);
			options.parentWindow.onBlur(stopShowingAsFocused);
			// TODO: also show as focused if focus is within the window

			// initial state
			// might need a setTimeout, idk...
			if (document.activeElement && document.activeElement.closest(".window") == options.parentWindow.element) {
				showAsFocused();
			}
		} else {
			// the browser window is the parent window
			// show focus whenever the browser window is focused
			$(window).on("focus", showAsFocused);
			$(window).on("blur", stopShowingAsFocused);
			// initial state
			if (document.hasFocus()) {
				showAsFocused();
			}
		}
	} else {
		// global focusout is needed, to continue showing as focused while child windows or menu popups are focused (@TODO: Is this redundant with focusin?)
		// global focusin is needed, to show as focused when a child window becomes focused (when perhaps nothing was focused before, so no focusout event)
		// global blur is needed, to show as focused when an iframe gets focus, because focusin/out doesn't fire at all in that case
		// global focus is needed, to stop showing as focused when an iframe loses focus
		// pretty ridiculous!!
		// but it still doesn't handle the case where the browser window is not focused, and the user clicks an iframe directly.
		// for that, we need to listen inside the iframe, because no events are fired at all outside in that case,
		// and :focus/:focus-within doesn't work with iframes so we can't even do a hack with transitionstart.
		// @TODO: simplify the strategy; I ended up piling a few strategies on top of each other, and the earlier ones may be redundant.
		// In particular, 1. I ended up making it proactively inject into iframes, rather than when focused since there's a case where focus can't be detected otherwise.
		// 2. I ended up simulating focusin events for iframes.
		// I may want to rely on that, or, I may want to remove that and set up a refocus chain directly instead,
		// avoiding refocus() which may interfere with drag operations in an iframe when focusing the iframe (e.g. clicking into Paint to draw or drag a sub-window).

		// console.log("adding global focusin/focusout/blur/focus for window", $w.element.id);
		const global_focus_update_handler = make_focus_in_out_handler(win.element, true); // must be $w and not $content so semantic parent chain works, with [data-semantic-parent] pointing to the window not the content
		window.addEventListener("focusin", global_focus_update_handler);
		window.addEventListener("focusout", global_focus_update_handler);
		window.addEventListener("blur", global_focus_update_handler);
		window.addEventListener("focus", global_focus_update_handler);

		/** @param {HTMLIFrameElement} iframe */
		function setupIframe(iframe) {
			if (!focus_update_handlers_by_container.has(iframe)) {
				const iframe_update_focus = make_focus_in_out_handler(iframe, false);
				// this also operates as a flag to prevent multiple handlers from being added, or waiting for the iframe to load duplicately
				focus_update_handlers_by_container.set(iframe, iframe_update_focus);

				// @TODO: try removing setTimeout(s)
				setTimeout(() => { // for iframe src to be set? I forget.
					// Note: try must be INSIDE setTimeout, not outside, to work.
					try {
						/** @param {() => void} callback */
						const wait_for_iframe_load = (callback) => {
							// Note: error may occur accessing iframe.contentDocument; this must be handled by the caller.
							// To that end, this function must access it synchronously, to allow the caller to handle the error.
							// @ts-ignore
							if (iframe.contentDocument.readyState == "complete") {
								callback();
							} else {
								// iframe.contentDocument.addEventListener("readystatechange", () => {
								// 	if (iframe.contentDocument.readyState == "complete") {
								// 		callback();
								// 	}
								// });
								setTimeout(() => {
									wait_for_iframe_load(callback);
								}, 100);
							}
						};
						wait_for_iframe_load(() => {
							// console.log("adding focusin/focusout/blur/focus for iframe", iframe);
							iframe.contentWindow.addEventListener("focusin", iframe_update_focus);
							iframe.contentWindow.addEventListener("focusout", iframe_update_focus);
							iframe.contentWindow.addEventListener("blur", iframe_update_focus);
							iframe.contentWindow.addEventListener("focus", iframe_update_focus);
							observeIframes(iframe.contentDocument);
						});
					} catch (error) {
						warn_iframe_access(iframe, error);
					}
				}, 100);
			}
		}

		/** @param {Document | Element} container_node */
		function observeIframes(container_node) {
			const observer = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					for (const node of mutation.addedNodes) {
						if (is_iframe(node)) {
							setupIframe(node);
						}
					}
				}
			});
			observer.observe(container_node, { childList: true, subtree: true });
			// needed in recursive calls (for iframes inside iframes)
			// (for the window, it shouldn't be able to have iframes yet)
			for (const iframe of container_node.querySelectorAll("iframe")) {
				setupIframe(iframe);
			}
		}

		observeIframes(win.$content[0]);

		/**
		 * @param {HTMLElement} logical_container_el 
		 * @param {boolean} is_root 
		 * @returns {(event: FocusEvent | null) => void}
		 */
		function make_focus_in_out_handler(logical_container_el, is_root) {
			// In case of iframes, logical_container_el is the iframe, and container_node is the iframe's contentDocument.
			// container_node is not a parameter here because it can change over time, may be an empty document before the iframe is loaded.

			return function handle_focus_in_out(event) {
				const container_node = is_iframe(logical_container_el) ? logical_container_el.contentDocument : logical_container_el;
				const document = container_node.ownerDocument ?? container_node;
				// is this equivalent?
				// const document = is_iframe(logical_container_el) ? logical_container_el.contentDocument : logical_container_el.ownerDocument;

				// console.log(`handling ${event.type} for container`, container_el);
				let newly_focused = event ? (event.type === "focusout" || event.type === "blur") ? event.relatedTarget : event.target : document.activeElement;
				if (event?.type === "blur") {
					newly_focused = null; // only handle iframe
				}

				// console.log(`[${$w.title()}] (is_root=${is_root})`, `newly_focused is (preliminarily)`, element_to_string(newly_focused), `\nlogical_container_el`, logical_container_el, `\ncontainer_node`, container_node, `\ndocument.activeElement`, document.activeElement, `\ndocument.hasFocus()`, document.hasFocus(), `\ndocument`, document);

				// Iframes are stingy about focus events, so we need to check if focus is actually within an iframe.
				if (
					document.activeElement &&
					is_iframe(document.activeElement) &&
					(event?.type === "focusout" || event?.type === "blur") &&
					!newly_focused // doesn't exist for security reasons in this case
				) {
					newly_focused = document.activeElement;
					// console.log(`[${$w.title()}] (is_root=${is_root})`, `newly_focused is (actually)`, element_to_string(newly_focused));
				}

				const outside_or_at_exactly =
					!newly_focused ||
					// contains() only works with DOM nodes (elements and documents), not window objects.
					// Since container_node is a DOM node, it will never have a Window inside of it (ignoring iframes).
					newly_focused.window === newly_focused || // is a Window object (cross-frame test)
					!container_node.contains(newly_focused); // Note: node.contains(node) === true
				const firmly_outside = outside_or_at_exactly && container_node !== newly_focused;

				// console.log(`[${$w.title()}] (is_root=${is_root})`, `outside_or_at_exactly=${outside_or_at_exactly}`, `firmly_outside=${firmly_outside}`);
				if (firmly_outside && is_root) {
					stopShowingAsFocused();
				}
				if (
					!outside_or_at_exactly &&
					newly_focused.tagName !== "HTML" &&
					newly_focused.tagName !== "BODY" &&
					newly_focused !== container_node &&
					!newly_focused.matches(".window-content") &&
					!newly_focused.closest(".menus") &&
					!newly_focused.closest(".window-titlebar")
				) {
					last_focus_by_container.set(logical_container_el, newly_focused); // overwritten for iframes below
					debug_focus_tracking(document, container_node, newly_focused, is_root);
				}

				if (
					!outside_or_at_exactly &&
					is_iframe(newly_focused)
				) {
					const iframe = newly_focused;
					// console.log("iframe", iframe, onfocusin_by_container.has(iframe));
					try {
						const focus_in_iframe = iframe.contentDocument.activeElement;
						if (
							focus_in_iframe &&
							focus_in_iframe.tagName !== "HTML" &&
							focus_in_iframe.tagName !== "BODY" &&
							!focus_in_iframe.closest(".menus")
						) {
							// last_focus_by_container.set(logical_container_el, iframe); // done above
							last_focus_by_container.set(iframe, focus_in_iframe);
							debug_focus_tracking(iframe.contentDocument, iframe.contentDocument, focus_in_iframe, is_root);
						}
					} catch (e) {
						warn_iframe_access(iframe, e);
					}
				}


				// For child windows and menu popups, follow "semantic parent" chain.
				// Menu popups and child windows aren't descendants of the window they belong to,
				// but should keep the window shown as focused.
				// (In principle this sort of feature could be useful for focus tracking*,
				// but right now it's only for child windows and menu popups, which should not be tracked for refocus,
				// so I'm doing this after last_focus_by_container.set, for now anyway.)
				// ((*: and it may even be surprising if it doesn't work, if one sees the attribute on menus and attempts to use it.
				// But who's going to see that? The menus close so it's a pain to see the DOM structure! :P **))
				// (((**: without window.debugKeepMenusOpen)))
				if (is_root) {
					do {
						// if (!newly_focused?.closest) {
						// 	console.warn("what is this?", newly_focused);
						// 	break;
						// }
						const waypoint = newly_focused?.closest?.("[data-semantic-parent]");
						if (waypoint) {
							const id = waypoint.dataset.semanticParent;
							const parent = waypoint.ownerDocument.getElementById(id);
							// console.log("following semantic parent, from", newly_focused, "\nto", parent, "\nvia", waypoint);
							newly_focused = parent;
							if (!parent) {
								console.warn("semantic parent not found with id", id);
								break;
							}
						} else {
							break;
						}
					} while (true);
				}

				// Note: allowing showing window as focused from listeners inside iframe (non-root) too,
				// in order to handle clicking an iframe when the browser window was not previously focused (e.g. after reload)
				if (
					newly_focused &&
					newly_focused.window !== newly_focused && // cross-frame test for Window object
					container_node.contains(newly_focused)
				) {
					showAsFocused();
					win.bringToFront();
					if (!is_root) {
						// trigger focusin events for iframes
						// @TODO: probably don't need showAsFocused() here since it'll be handled externally (on this simulated focusin),
						// and might not need a lot of other logic frankly if I'm simulating focusin events
						/** @type {Element | null | undefined} */
						let el = logical_container_el;
						while (el) {
							// console.log("dispatching focusin event for", el);
							el.dispatchEvent(new Event("focusin", {
								bubbles: true,
								target: el,
								view: el.ownerDocument.defaultView,
							}));
							el = el.ownerDocument.defaultView?.frameElement;
						}
					}
				} else if (is_root) {
					stopShowingAsFocused();
				}
			}
		}
		// initial state is unfocused
	}

	$window_element.css("touch-action", "none");

	/** @type {HTMLElement | null | undefined} */
	let minimize_target_el = null; // taskbar button (optional)
	win.setMinimizeTarget = function (new_taskbar_button_el) {
		minimize_target_el = new_taskbar_button_el;
	};

	/** @type {{$task: JQuery<HTMLElement>} | undefined} */
	let task;
	Object.defineProperty(win, "task", {
		get() {
			return task;
		},
		set(new_task) {
			console.warn("DEPRECATED: use $w.setMinimizeTarget(taskbar_button_el) instead of setting $window.task object");
			task = new_task;
		},
	});

	/** @type {{ position: string; left: string; top: string; width: string; height: string; }} */
	let before_minimize;
	win.minimize = () => {
		minimize_target_el = minimize_target_el || task?.$task[0];
		if (animating_titlebar) {
			when_done_animating_titlebar.push(win.minimize);
			return;
		}
		if ($window_element.is(":visible")) {
			if (minimize_target_el && !$window_element.hasClass("minimized-without-taskbar")) {
				const before_rect = win.$titlebar[0].getBoundingClientRect();
				const after_rect = minimize_target_el.getBoundingClientRect();
				win.animateTitlebar(before_rect, after_rect, () => {
					$window_element.hide();
					win.blur();
				});
				$window_element.addClass("minimized");
			} else {
				// no taskbar

				// @TODO: make this metrically similar to what Windows 98 does
				// @TODO: DRY! This is copied heavily from maximize()
				// @TODO: after minimize (without taskbar) and maximize, restore should restore original position before minimize
				// OR should it not maximize but restore the unmaximized state? I think I tested it but I forget.

				const to_width = 150;
				const spacing = 10;
				if ($window_element.hasClass("minimized-without-taskbar")) {
					// unminimizing
					minimize_slots[win._minimize_slot_index] = null;
				} else {
					// minimizing
					let i = 0;
					while (minimize_slots[i]) {
						i++;
					}
					win._minimize_slot_index = i;
					minimize_slots[i] = win;
				}
				const to_x = win._minimize_slot_index * (to_width + spacing) + 10;
				const titlebar_height = win.$titlebar.outerHeight() ?? 0;
				/** @type {{ position: string; left: string; top: string; width: string; height: string; }} */
				let before_unminimize;
				const instantly_minimize = () => {
					before_minimize = {
						position: $window_element.css("position"),
						left: $window_element.css("left"),
						top: $window_element.css("top"),
						width: $window_element.css("width"),
						height: $window_element.css("height"),
					};

					$window_element.addClass("minimized-without-taskbar");
					if ($window_element.hasClass("maximized")) {
						$window_element.removeClass("maximized");
						$window_element.addClass("was-maximized");
						win.$maximize.removeClass("window-action-restore");
						win.$maximize.addClass("window-action-maximize");
					}
					win.$minimize.removeClass("window-action-minimize");
					win.$minimize.addClass("window-action-restore");
					if (before_unminimize) {
						$window_element.css({
							position: before_unminimize.position,
							left: before_unminimize.left,
							top: before_unminimize.top,
							width: before_unminimize.width,
							height: before_unminimize.height,
						});
					} else {
						$window_element.css({
							position: "fixed",
							top: `calc(100% - ${titlebar_height + 5}px)`,
							left: `${to_x}px`,
							width: `${to_width}px`,
							height: `${titlebar_height}px`,
						});
					}
				};
				const instantly_unminimize = () => {
					before_unminimize = {
						position: $window_element.css("position"),
						left: $window_element.css("left"),
						top: $window_element.css("top"),
						width: $window_element.css("width"),
						height: $window_element.css("height"),
					};

					$window_element.removeClass("minimized-without-taskbar");
					if ($window_element.hasClass("was-maximized")) {
						$window_element.removeClass("was-maximized");
						$window_element.addClass("maximized");
						win.$maximize.removeClass("window-action-maximize");
						win.$maximize.addClass("window-action-restore");
					}
					win.$minimize.removeClass("window-action-restore");
					win.$minimize.addClass("window-action-minimize");
					$window_element.css({ width: "", height: "" });
					if (before_minimize) {
						$window_element.css({
							position: before_minimize.position,
							left: before_minimize.left,
							top: before_minimize.top,
							width: before_minimize.width,
							height: before_minimize.height,
						});
					}
				};

				const before_rect = win.$titlebar[0].getBoundingClientRect();
				let after_rect;
				$window_element.css("transform", "");
				if ($window_element.hasClass("minimized-without-taskbar")) {
					instantly_unminimize();
					after_rect = win.$titlebar[0].getBoundingClientRect();
					instantly_minimize();
				} else {
					instantly_minimize();
					after_rect = win.$titlebar[0].getBoundingClientRect();
					instantly_unminimize();
				}
				win.animateTitlebar(before_rect, after_rect, () => {
					if ($window_element.hasClass("minimized-without-taskbar")) {
						instantly_unminimize();
					} else {
						instantly_minimize();
						win.blur();
					}
				});
			}
		}
	};
	win.unminimize = () => {
		if (animating_titlebar) {
			when_done_animating_titlebar.push(win.unminimize);
			return;
		}
		if ($window_element.hasClass("minimized-without-taskbar")) {
			win.minimize(); // handles unminimization from this state
			return;
		}
		if ($window_element.is(":hidden")) {
			const before_rect = minimize_target_el.getBoundingClientRect();
			$window_element.show();
			const after_rect = win.$titlebar[0].getBoundingClientRect();
			$window_element.hide();
			win.animateTitlebar(before_rect, after_rect, () => {
				$window_element.show();
				win.bringToFront();
				win.focus();
			});
		}
	};

	/** @type {{ position: string; left: string; top: string; width: string; height: string; }} */
	let before_maximize;
	win.maximize = () => {
		if (!options.resizable) {
			return;
		}
		if (animating_titlebar) {
			when_done_animating_titlebar.push(win.maximize);
			return;
		}
		if ($window_element.hasClass("minimized-without-taskbar")) {
			win.minimize();
			return;
		}

		const instantly_maximize = () => {
			before_maximize = {
				position: $window_element.css("position"),
				left: $window_element.css("left"),
				top: $window_element.css("top"),
				width: $window_element.css("width"),
				height: $window_element.css("height"),
			};

			$window_element.addClass("maximized");
			const $taskbar = $(".taskbar");
			const scrollbar_width = window.innerWidth - $(window).width();
			const scrollbar_height = window.innerHeight - $(window).height();
			const taskbar_height = $taskbar.length ? $taskbar.outerHeight() + 1 : 0;
			$window_element.css({
				position: "fixed",
				top: 0,
				left: 0,
				width: `calc(100vw - ${scrollbar_width}px)`,
				height: `calc(100vh - ${scrollbar_height}px - ${taskbar_height}px)`,
			});
		};
		const instantly_unmaximize = () => {
			$window_element.removeClass("maximized");
			$window_element.css({ width: "", height: "" });
			if (before_maximize) {
				$window_element.css({
					position: before_maximize.position,
					left: before_maximize.left,
					top: before_maximize.top,
					width: before_maximize.width,
					height: before_maximize.height,
				});
			}
		};

		const before_rect = win.$titlebar[0].getBoundingClientRect();
		let after_rect;
		$window_element.css("transform", "");
		const restoring = $window_element.hasClass("maximized");
		if (restoring) {
			instantly_unmaximize();
			after_rect = win.$titlebar[0].getBoundingClientRect();
			instantly_maximize();
		} else {
			instantly_maximize();
			after_rect = win.$titlebar[0].getBoundingClientRect();
			instantly_unmaximize();
		}
		win.animateTitlebar(before_rect, after_rect, () => {
			if (restoring) {
				instantly_unmaximize(); // finalize in some way
				win.$maximize.removeClass("window-action-restore");
				win.$maximize.addClass("window-action-maximize");
			} else {
				instantly_maximize(); // finalize in some way
				win.$maximize.removeClass("window-action-maximize");
				win.$maximize.addClass("window-action-restore");
			}
		});
	};
	win.restore = () => {
		if ($window_element.is(".minimized-without-taskbar, .minimized")) {
			win.unminimize();
		} else if ($window_element.is(".maximized")) {
			win.maximize(); // toggles maximization
		}
	};
	// must not pass event to functions by accident; also methods may not be defined yet
	win.$minimize?.on("click", (e) => { win.minimize(); });
	win.$maximize?.on("click", (e) => { win.maximize(); });
	win.$x?.on("click", (e) => { win.close(); });
	win.$title_area.on("dblclick", (e) => { win.maximize(); });

	$window_element.css({
		position: "absolute",
		zIndex: $Window.Z_INDEX++
	});
	win.bringToFront = () => {
		$window_element.css({
			zIndex: $Window.Z_INDEX++
		});
		for (const $childWindow of child_$windows) {
			$childWindow.bringToFront();
		}
	};

	// Keep track of last focused elements per container,
	// where containers include:
	// - window (global focus tracking)
	// - win.element (window-local, for restoring focus when refocusing window)
	// - any iframes that are same-origin (for restoring focus when refocusing window)
	// @TODO: should these be WeakMaps? probably.
	// @TODO: share this Map between all windows? but clean it up when destroying windows? or would a WeakMap take care of that?
	
	/** @typedef {HTMLElement | Window} FocusTrackingContainer */
	/** @typedef {SVGSVGElement & { _container_el: HTMLElement; _descendant_el: HTMLElement; _is_root: boolean; }} FocusTrackingSVG */
	
	/**
	 * element to restore focus to, by container
	 * @type {Map<FocusTrackingContainer, HTMLElement>}
	 */
	var last_focus_by_container = new Map();
	/**
	 * event handlers by container; note use as a flag to avoid adding multiple handlers 
	 * @type {Map<FocusTrackingContainer, (event: FocusEvent | null) => void>}
	 */
	var focus_update_handlers_by_container = new Map();
	/**
	 * for visualization
	 * @type {Map<FocusTrackingContainer, FocusTrackingSVG>}
	 */
	var debug_svg_by_container = new Map();
	/**
	 * for visualization
	 * @type {FocusTrackingSVG[]}
	 */
	var debug_svgs_in_window = [];
	/**
	 * prevent spamming console
	 * @type {WeakSet<HTMLIFrameElement>}
	 */
	var warned_iframes = new WeakSet();

	/**
	 * @param {HTMLIFrameElement} iframe 
	 * @param {Error | unknown} error 
	 */
	const warn_iframe_access = (iframe, error) => {
		/** @param {string} message */
		const log_template = (message) => [`OS-GUI.js failed to access an iframe (${element_to_string(iframe)}) for focus integration.
${message}
Original error:
`, error];

		let cross_origin;
		if (iframe.srcdoc) {
			cross_origin = false;
		} else {
			try {
				const url = new URL(iframe.src);
				cross_origin = url.origin !== window.location.origin; // shouldn't need to use iframe.ownerDocument.location.origin because intermediate iframes must be same-origin
			} catch (parse_error) {
				console.error(...log_template(`This may be a bug in OS-GUI. Is this a cross-origin iframe? Failed to parse URL (${parse_error}).`));
				return;
			}
		}
		if (cross_origin) {
			if (options.iframes?.ignoreCrossOrigin && !warned_iframes.has(iframe)) {
				console.warn(...log_template(`Only same-origin iframes can work with focus integration (showing window as focused, refocusing last focused controls).
If you can re-host the content on the same origin, you can resolve this and enable focus integration.
You can also disable this warning by passing {iframes: {ignoreCrossOrigin: true}} to $Window.`));
				warned_iframes.add(iframe);
			}
		} else {
			console.error(...log_template(`This may be a bug in OS-GUI, since it doesn't appear to be a cross-origin iframe.`));
		}
	};

	/**
	 * @param {Document} document 
	 * @param {HTMLElement} container_el 
	 * @param {HTMLElement} descendant_el 
	 * @param {boolean} is_root 
	 */
	const debug_focus_tracking = (document, container_el, descendant_el, is_root) => {
		if (!$Window.DEBUG_FOCUS) {
			return;
		}
		let svg = debug_svg_by_container.get(container_el);
		if (!svg) {
			svg = /** @type {FocusTrackingSVG} */(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
			svg.style.position = "fixed";
			svg.style.top = "0";
			svg.style.left = "0";
			svg.style.width = "100%";
			svg.style.height = "100%";
			svg.style.pointerEvents = "none";
			svg.style.zIndex = "100000000";
			svg.style.direction = "ltr"; // position labels correctly
			debug_svg_by_container.set(container_el, svg);
			debug_svgs_in_window.push(svg);
			document.body.appendChild(svg);
		}
		svg._container_el = container_el;
		svg._descendant_el = descendant_el;
		svg._is_root = is_root;
		animate_debug_focus_tracking();
	};
	/** @param {FocusTrackingSVG} svg */
	const update_debug_focus_tracking = (svg) => {
		const container_el = svg._container_el;
		const descendant_el = svg._descendant_el;
		const is_root = svg._is_root;

		while (svg.lastChild) {
			svg.removeChild(svg.lastChild);
		}
		const descendant_rect = descendant_el.getBoundingClientRect?.() ?? { left: 0, top: 0, width: innerWidth, height: innerHeight, right: innerWidth, bottom: innerHeight };
		const container_rect = container_el.getBoundingClientRect?.() ?? { left: 0, top: 0, width: innerWidth, height: innerHeight, right: innerWidth, bottom: innerHeight };
		// draw rectangles with labels
		for (const rect of [descendant_rect, container_rect]) {
			const rect_el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			rect_el.setAttribute("x", `${rect.left}`);
			rect_el.setAttribute("y", `${rect.top}`);
			rect_el.setAttribute("width", `${rect.width}`);
			rect_el.setAttribute("height", `${rect.height}`);
			rect_el.setAttribute("stroke", rect === descendant_rect ? "#f44" : "#f44");
			rect_el.setAttribute("stroke-width", "2");
			rect_el.setAttribute("fill", "none");
			if (!is_root) {
				rect_el.setAttribute("stroke-dasharray", "5,5");
			}
			svg.appendChild(rect_el);
			const text_el = document.createElementNS("http://www.w3.org/2000/svg", "text");
			text_el.setAttribute("x", `${rect.left}`);
			text_el.setAttribute("y", `${rect.top + (rect === descendant_rect ? 20 : 0)}`); // align container text on outside, descendant text on inside
			text_el.setAttribute("fill", rect === descendant_rect ? "#f44" : "aqua");
			text_el.setAttribute("font-size", "20");
			text_el.style.textShadow = "1px 1px 1px black, 0 0 10px black";
			text_el.textContent = element_to_string(rect === descendant_rect ? descendant_el : container_el);
			svg.appendChild(text_el);
		}
		// draw lines connecting the two rects
		const lines = [
			[descendant_rect.left, descendant_rect.top, container_rect.left, container_rect.top],
			[descendant_rect.right, descendant_rect.top, container_rect.right, container_rect.top],
			[descendant_rect.left, descendant_rect.bottom, container_rect.left, container_rect.bottom],
			[descendant_rect.right, descendant_rect.bottom, container_rect.right, container_rect.bottom],
		];
		for (const line of lines) {
			const line_el = document.createElementNS("http://www.w3.org/2000/svg", "line");
			line_el.setAttribute("x1", `${line[0]}`);
			line_el.setAttribute("y1", `${line[1]}`);
			line_el.setAttribute("x2", `${line[2]}`);
			line_el.setAttribute("y2", `${line[3]}`);
			line_el.setAttribute("stroke", "green");
			line_el.setAttribute("stroke-width", "2");
			svg.appendChild(line_el);
		}
	};
	/** @type {number} */
	let debug_animation_frame_id;
	const animate_debug_focus_tracking = () => {
		cancelAnimationFrame(debug_animation_frame_id);
		if (!$Window.DEBUG_FOCUS) {
			clean_up_debug_focus_tracking();
			return;
		}
		debug_animation_frame_id = requestAnimationFrame(animate_debug_focus_tracking);
		for (const svg of debug_svgs_in_window) {
			update_debug_focus_tracking(svg);
		}
	};
	const clean_up_debug_focus_tracking = () => {
		cancelAnimationFrame(debug_animation_frame_id);
		for (const svg of debug_svgs_in_window) {
			svg.remove();
		}
		debug_svgs_in_window.length = 0;
		debug_svg_by_container.clear();
	};

	const refocus = (container_el = win.$content[0]) => {
		const logical_container_el = container_el.matches(".window-content") ? win.element : container_el;
		const last_focus = last_focus_by_container.get(logical_container_el);
		if (last_focus) {
			// If `last_focus` is a `Window`, what will happen / should happen?
			last_focus.focus({ preventScroll: true });
			if (is_iframe(last_focus)) {
				try {
					refocus(last_focus);
				} catch (e) {
					warn_iframe_access(/** @type {HTMLIFrameElement} */(last_focus), e);
				}
			}
			return;
		}
		const $tabstops = find_tabstops(container_el);
		const $default = $tabstops.filter(".default");
		if ($default.length) {
			$default[0].focus({ preventScroll: true });
			return;
		}
		if ($tabstops.length) {
			if (is_iframe($tabstops[0])) {
				const iframe = $tabstops[0];
				try {
					refocus(iframe); // not .contentDocument.body because we want the container tracked by last_focus_by_container
				} catch (e) {
					warn_iframe_access(iframe, e);
				}
			} else {
				$tabstops[0].focus({ preventScroll: true });
			}
			return;
		}
		if (options.toolWindow && options.parentWindow) {
			$(options.parentWindow.element).triggerHandler("refocus-window");
			return;
		}
		container_el.focus({ preventScroll: true });
		if (is_iframe(container_el)) {
			const iframe = container_el;
			try {
				// @ts-ignore
				refocus(iframe.contentDocument.body);
			} catch (e) {
				warn_iframe_access(iframe, e);
			}
		}
	};

	$window_element.on("refocus-window", () => {
		refocus();
	});

	// redundant events are for handling synthetic events,
	// which may be sent individually, rather than in tandem
	$window_element.on("pointerdown mousedown", handle_pointer_activation);
	// Note that jQuery treats some events differently, and can't listen for some synthetic events
	// but pointerdown and mousedown seem to be supported. That said, if you trigger() either,
	// addEventListener() handlers will not be called. So if I remove the dependency on jQuery,
	// it will not be possible to listen for some .trigger() events.
	// https://jsfiddle.net/1j01/ndvwts9y/1/

	// Assumption: focusin comes after pointerdown/mousedown
	// This is probably guaranteed, because you can prevent the default of focusing from pointerdown/mousedown
	$G.on("focusin", (e) => {
		// The spec says "The event target MUST be the element which received focus." https://www.w3.org/TR/2024/WD-uievents-20240622/#focusin
		// but it can also be the Window object!
		last_focus_by_container.set(window, e.target);
		// debug_focus_tracking(document, window, e.target);
	});

	/** @param {Event} event */
	function handle_pointer_activation(event) {
		// console.log("handle_pointer_activation", event.type, event.target);
		win.bringToFront();
		// Test cases where it should refocus the last focused control in the window:
		// - Click in the blank space of the window
		//   - Click in blank space again now that something's focused
		// - Click on the window title bar
		//   - Click on title bar buttons
		// - Closing a second window should focus the first window
		//   - Open a dialog window from an app window that has a tool window, then close the dialog window
		//     - @TODO: Even if the tool window has controls, it should focus the parent window, I think
		// - Clicking on a control in the window should focus said control
		// - Clicking on a disabled control in the window should focus the window
		//   - Make sure to test this with another window previously focused
		// - Simulated clicks (important for JS Paint's eye gaze and speech recognition modes)
		// - (@TODO: Should clicking a child window focus the parent window?)
		// - After potentially selecting text but not selecting anything
		// It should NOT refocus when:
		// - Clicking on a control in a different window
		// - When other event handlers set focus
		//   - Using the keyboard to focus something outside the window, such as a menu popup
		//   - Clicking a control that focuses something outside the window
		//     - Button that opens another window (e.g. Recursive Dialog button in tests)
		//     - Button that focuses a control in another window (e.g. Focus Other button in tests)
		// - Trying to select text

		// Wait for other pointerdown handlers and default behavior, and focusin events.
		requestAnimationFrame(() => {
			const last_focus_global = last_focus_by_container.get(window);
			// const last_focus_in_window = last_focus_by_container.get(win.$content[0]);
			// console.log("a tick after", event.type, { last_focus_in_window, last_focus_global, activeElement: document.activeElement, win_elem: win.element });
			// console.log("did focus change?", document.activeElement !== last_focus_global);

			// If something programmatically got focus, don't refocus.
			if (
				document.activeElement &&
				// @ts-ignore (just in case)
				document.activeElement !== document &&
				document.activeElement !== document.body &&
				document.activeElement !== win.$content[0] &&
				document.activeElement !== last_focus_global
			) {
				return;
			}
			// If menus got focus, don't refocus.
			if (document.activeElement?.closest?.(".menus, .menu-popup")) {
				// console.log("click in menus");
				return;
			}

			// If the element is selectable, wait until the click is done and see if anything was selected first.
			// This is a bit of a weird compromise, for now.
			const target_style = getComputedStyle(event.target);
			if (target_style.userSelect !== "none") {
				// Immediately show the window as focused, just don't refocus a specific control.
				win.$content.focus();

				$window_element.one("pointerup pointercancel", () => {
					requestAnimationFrame(() => { // this seems to make it more reliable in regards to double clicking
						if (!getSelection()?.toString().trim()) {
							refocus();
						}
					});
				});
				return;
			}
			// Set focus to the last focused control, which should be updated if a click just occurred.
			refocus();
		});
	}

	$window_element.on("keydown", (e) => {
		if (e.isDefaultPrevented()) {
			return;
		}
		if (e.ctrlKey || e.altKey || e.metaKey) {
			return;
		}
		// console.log("keydown", e.key, e.target);
		if (e.target.closest(".menus")) {
			// console.log("keydown in menus");
			return;
		}
		const $buttons = win.$content.find("button");
		// XXX: Lying a little bit here, but TS seems confused otherwise, giving the type as JQueryStatic
		const $focused = $(/** @type {HTMLElement} */(document.activeElement));
		const focused_index = $buttons.index($focused);
		switch (e.keyCode) {
			case 40: // Down
			case 39: // Right
				if ($focused.is("button") && !e.shiftKey) {
					if (focused_index < $buttons.length - 1) {
						$buttons[focused_index + 1].focus();
						e.preventDefault();
					}
				}
				break;
			case 38: // Up
			case 37: // Left
				if ($focused.is("button") && !e.shiftKey) {
					if (focused_index > 0) {
						$buttons[focused_index - 1].focus();
						e.preventDefault();
					}
				}
				break;
			case 32: // Space
			case 13: // Enter (doesn't actually work in chrome because the button gets clicked immediately)
				if ($focused.is("button") && !e.shiftKey) {
					$focused.addClass("pressed");
					const release = () => {
						$focused.removeClass("pressed");
						$focused.off("focusout", release);
						$(window).off("keyup", keyup);
					};
					const keyup = (/** @type {{ keyCode: number; }} */ e) => {
						if (e.keyCode === 32 || e.keyCode === 13) {
							release();
						}
					};
					$focused.on("focusout", release);
					$(window).on("keyup", keyup);
				}
				break;
			case 9: { // Tab
				// wrap around when tabbing through controls in a window
				const $controls = find_tabstops(win.$content[0]);
				if ($controls.length > 0) {
					const focused_control_index = $controls.index($focused);
					if (e.shiftKey) {
						if (focused_control_index === 0) {
							e.preventDefault();
							$controls[$controls.length - 1].focus();
						}
					} else {
						if (focused_control_index === $controls.length - 1) {
							e.preventDefault();
							$controls[0].focus();
						}
					}
				}
				break;
			}
			case 27: // Escape
				// @TODO: make this optional, and probably default false
				win.close();
				break;
		}
	});

	win.applyBounds = () => {
		// TODO: outerWidth vs width? not sure
		const bound_width = Math.max(document.body.scrollWidth, innerWidth);
		const bound_height = Math.max(document.body.scrollHeight, innerHeight);
		$window_element.css({
			left: Math.max(0, Math.min(bound_width - $window_element.width(), $window_element.position().left)),
			top: Math.max(0, Math.min(bound_height - $window_element.height(), $window_element.position().top)),
		});
	};

	win.bringTitleBarInBounds = () => {
		// Try to make the titlebar always accessible
		const bound_width = Math.max(document.body.scrollWidth, innerWidth);
		const bound_height = Math.max(document.body.scrollHeight, innerHeight);
		const min_horizontal_pixels_on_screen = 40; // enough for space past a close button
		$window_element.css({
			left: Math.max(
				min_horizontal_pixels_on_screen - $window_element.outerWidth(),
				Math.min(
					bound_width - min_horizontal_pixels_on_screen,
					$window_element.position().left
				)
			),
			top: Math.max(0, Math.min(
				bound_height - win.$titlebar.outerHeight() - 5,
				$window_element.position().top
			)),
		});
	};

	win.center = () => {
		$window_element.css({
			left: (innerWidth - $window_element.width()) / 2 + window.scrollX,
			top: (innerHeight - $window_element.height()) / 2 + window.scrollY,
		});
		win.applyBounds();
	};


	$G.on("resize", win.bringTitleBarInBounds);

	/** @type {number} */
	var drag_offset_x;
	/** @type {number} */
	var drag_offset_y;
	/** @type {number} */
	var drag_pointer_x;
	/** @type {number} */
	var drag_pointer_y;
	/** @type {number} */
	var drag_pointer_id;
	/** @param {JQuery.TriggeredEvent} e */
	var update_drag = (e) => {
		const pointerId = e.pointerId ?? e.originalEvent?.pointerId; // originalEvent doesn't exist for triggerHandler()
		if (
			drag_pointer_id === pointerId ||
			pointerId === undefined || // (allowing synthetic events to affect the drag without pointerId)
			drag_pointer_id === undefined || // (allowing real events to affect a drag started with a synthetic event without a pointerId, for jspaint's Eye Gaze Mode... uh...)
			drag_pointer_id === 1234567890 // allowing real events to affect a drag started with a synthetic event with this fake pointerId, for jspaint's Eye Gaze Mode!!
			// @TODO: find a better way to support synthetic events (could make the fake pointerId a formal part of the API contract at least...)
		) {
			drag_pointer_x = e.clientX ?? drag_pointer_x;
			drag_pointer_y = e.clientY ?? drag_pointer_y;
		}
		$window_element.css({
			left: drag_pointer_x + scrollX - drag_offset_x,
			top: drag_pointer_y + scrollY - drag_offset_y,
		});
	};
	win.$titlebar.css("touch-action", "none");
	win.$titlebar.on("selectstart", (e) => { // preventing mousedown would break :active state, I'm not sure if just selectstart is enough...
		e.preventDefault();
	});
	win.$titlebar.on("mousedown", "button", (e) => {
		// Prevent focus on titlebar buttons.
		// This can break the :active state. In Firefox, a setTimeout before any focus() was enough,
		// but now in Chrome 95, focus() breaks the :active state too, and setTimeout only delays the brokenness,
		// so I have to use a CSS class now for the pressed state.
		refocus();
		// Emulate :enabled:active:hover state with .pressing class
		const button = e.currentTarget;
		if (!$(button).is(":enabled")) {
			return;
		}
		button.classList.add("pressing");
		/** @param {JQuery.TriggeredEvent} event */
		const release = (event) => {
			// blur is just to handle the edge case of alt+tabbing/ctrl+tabbing away
			if (event && event.type === "blur") {
				// if (is_iframe(document.activeElement)) {
				if (document.hasFocus()) {
					return; // the window isn't really blurred; an iframe got focus
				}
			}
			button.classList.remove("pressing");
			$G.off("mouseup blur", release);
			$(button).off("mouseenter", on_mouse_enter);
			$(button).off("mouseleave", on_mouse_leave);
		};
		const on_mouse_enter = () => { button.classList.add("pressing"); };
		const on_mouse_leave = () => { button.classList.remove("pressing"); };
		$G.on("mouseup blur", release);
		$(button).on("mouseenter", on_mouse_enter);
		$(button).on("mouseleave", on_mouse_leave);
	});
	win.$titlebar.on("pointerdown", (e) => {
		if ($(e.target).closest("button").length) {
			return;
		}
		if ($window_element.hasClass("maximized")) {
			return;
		}

		// Allow overriding drag behavior for component windows in jspaint (Tools / Colors windows)
		// new event system
		let prevented = false;
		dispatch_before_drag({
			preventDefault: () => { prevented = true; }
		});
		if (prevented) {
			return;
		}
		// legacy jQuery event
		const customEvent = $.Event("window-drag-start");
		$window_element.trigger(customEvent);
		if (customEvent.isDefaultPrevented()) {
			return;
		}

		drag_offset_x = e.clientX + scrollX - $window_element.position().left;
		drag_offset_y = e.clientY + scrollY - $window_element.position().top;
		drag_pointer_x = e.clientX;
		drag_pointer_y = e.clientY;
		drag_pointer_id = (e.pointerId ?? e.originalEvent?.pointerId); // originalEvent doesn't exist for triggerHandler()
		$G.on("pointermove", update_drag);
		$G.on("scroll", update_drag);
		$("body").addClass("dragging"); // for when mouse goes over an iframe
	});
	$G.on("pointerup pointercancel", (e) => {
		const pointerId = e.pointerId ?? e.originalEvent?.pointerId; // originalEvent doesn't exist for triggerHandler()
		if (pointerId !== drag_pointer_id && pointerId !== undefined) { return; } // (allowing synthetic events to affect the drag without pointerId)
		$G.off("pointermove", update_drag);
		$G.off("scroll", update_drag);
		$("body").removeClass("dragging");
		// win.applyBounds(); // Windows doesn't really try to keep windows on screen
		// but you also can't really drag off of the desktop, whereas here you can drag to way outside the web page.
		win.bringTitleBarInBounds();
		drag_pointer_id = -1; // prevent bringTitleBarInBounds from making the window go to top left when unminimizing window from taskbar after previously dragging it
	});
	win.$titlebar.on("dblclick", (e) => {
		if ($component) {
			$component.dock();
		}
	});

	if (options.resizable) {

		const HANDLE_MIDDLE = 0;
		const HANDLE_START = -1;
		const HANDLE_END = 1;
		const HANDLE_LEFT = HANDLE_START;
		const HANDLE_RIGHT = HANDLE_END;
		const HANDLE_TOP = HANDLE_START;
		const HANDLE_BOTTOM = HANDLE_END;

		/** @type {[(0 | -1 | 1), (0 | -1 | 1)][]} */
		const handle_positions = [
			[HANDLE_TOP, HANDLE_RIGHT], // ↗
			[HANDLE_TOP, HANDLE_MIDDLE], // ↑
			[HANDLE_TOP, HANDLE_LEFT], // ↖
			[HANDLE_MIDDLE, HANDLE_LEFT], // ←
			[HANDLE_BOTTOM, HANDLE_LEFT], // ↙
			[HANDLE_BOTTOM, HANDLE_MIDDLE], // ↓
			[HANDLE_BOTTOM, HANDLE_RIGHT], // ↘
			[HANDLE_MIDDLE, HANDLE_RIGHT], // →
		];
		handle_positions.forEach(([y_axis, x_axis]) => {
			// const resizes_height = y_axis !== HANDLE_MIDDLE;
			// const resizes_width = x_axis !== HANDLE_MIDDLE;
			const $handle = $("<div>").addClass("handle").appendTo($window_element);

			let cursor = "";
			if (y_axis === HANDLE_TOP) { cursor += "n"; }
			if (y_axis === HANDLE_BOTTOM) { cursor += "s"; }
			if (x_axis === HANDLE_LEFT) { cursor += "w"; }
			if (x_axis === HANDLE_RIGHT) { cursor += "e"; }
			cursor += "-resize";

			// Note: MISNOMER: innerWidth() is less "inner" than width(), because it includes padding!
			// Here's a little diagram of sorts:
			// outerWidth(true): margin, [ outerWidth(): border, [ innerWidth(): padding, [ width(): content ] ] ]
			const handle_thickness = ($window_element.outerWidth() - $window_element.width()) / 2; // padding + border
			const border_width = ($window_element.outerWidth() - $window_element.innerWidth()) / 2; // border; need to outset the handles by this amount so they overlap the border + padding, and not the content
			const window_frame_height = $window_element.outerHeight() - win.$content.outerHeight(); // includes titlebar and borders, padding, but not content
			const window_frame_width = $window_element.outerWidth() - win.$content.outerWidth(); // includes borders, padding, but not content
			$handle.css({
				position: "absolute",
				top: y_axis === HANDLE_TOP ? -border_width : y_axis === HANDLE_MIDDLE ? `calc(${handle_thickness}px - ${border_width}px)` : "",
				bottom: y_axis === HANDLE_BOTTOM ? -border_width : "",
				left: x_axis === HANDLE_LEFT ? -border_width : x_axis === HANDLE_MIDDLE ? `calc(${handle_thickness}px - ${border_width}px)` : "",
				right: x_axis === HANDLE_RIGHT ? -border_width : "",
				width: x_axis === HANDLE_MIDDLE ? `calc(100% - ${handle_thickness}px * 2 + ${border_width * 2}px)` : `${handle_thickness}px`,
				height: y_axis === HANDLE_MIDDLE ? `calc(100% - ${handle_thickness}px * 2 + ${border_width * 2}px)` : `${handle_thickness}px`,
				// background: x_axis === HANDLE_MIDDLE || y_axis === HANDLE_MIDDLE ? "rgba(255,0,0,0.4)" : "rgba(0,255,0,0.8)",
				touchAction: "none",
				cursor,
			});

			/** @type {{ x: number, y: number, width: number, height: number }} */
			let rect;
			/** @type {number} */
			let resize_offset_x;
			/** @type {number} */
			let resize_offset_y;
			/** @type {number} */
			let resize_pointer_x;
			/** @type {number} */
			let resize_pointer_y;
			/** @type {number} */
			let resize_pointer_id;
			$handle.on("pointerdown", (e) => {
				e.preventDefault();

				$G.on("pointermove", handle_pointermove);
				$G.on("scroll", update_resize); // scroll doesn't have clientX/Y, so we have to remember it
				$("body").addClass("dragging"); // for when mouse goes over an iframe
				$G.on("pointerup pointercancel", end_resize);

				rect = {
					x: $window_element.position().left,
					y: $window_element.position().top,
					width: $window_element.outerWidth(),
					height: $window_element.outerHeight(),
				};

				resize_offset_x = e.clientX + scrollX - rect.x - (x_axis === HANDLE_RIGHT ? rect.width : 0);
				resize_offset_y = e.clientY + scrollY - rect.y - (y_axis === HANDLE_BOTTOM ? rect.height : 0);
				resize_pointer_x = e.clientX;
				resize_pointer_y = e.clientY;
				resize_pointer_id = (e.pointerId ?? e.originalEvent?.pointerId); // originalEvent doesn't exist for triggerHandler()

				try {
					$handle[0].setPointerCapture(resize_pointer_id); // keeps cursor consistent when mouse moves over other elements
				} catch (error) {
					// Prevent error from failing test; Cypress sends synthetic events that aren't trusted; I could pass a pointerId but not an active pointer id
					// NotFoundError: Failed to execute 'setPointerCapture' on 'Element': No active pointer with the given id is found.
					console.warn("Failed to capture pointer for resize handle drag:", error);
				}

				// handle_pointermove(e); // was useful for checking that the offset is correct (should not do anything, if it's correct!)
			});
			function handle_pointermove(/** @type {JQuery.TriggeredEvent} */ e) {
				const pointerId = e.pointerId ?? e.originalEvent?.pointerId; // originalEvent doesn't exist for triggerHandler()
				if (pointerId !== resize_pointer_id && pointerId !== undefined) { return; } // (allowing synthetic events to affect the drag without pointerId)
				resize_pointer_x = e.clientX;
				resize_pointer_y = e.clientY;
				update_resize();
			}
			function end_resize(/** @type {JQuery.TriggeredEvent} */ e) {
				const pointerId = e.pointerId ?? e.originalEvent?.pointerId; // originalEvent doesn't exist for triggerHandler()
				if (pointerId !== resize_pointer_id && pointerId !== undefined) { return; } // (allowing synthetic events to affect the drag without pointerId)
				$G.off("pointermove", handle_pointermove);
				$("body").removeClass("dragging");
				$G.off("pointerup pointercancel", end_resize);
				win.bringTitleBarInBounds();
			}
			function update_resize() {
				const mouse_x = resize_pointer_x + scrollX - resize_offset_x;
				const mouse_y = resize_pointer_y + scrollY - resize_offset_y;
				let delta_x = 0;
				let delta_y = 0;
				let width, height;
				if (x_axis === HANDLE_RIGHT) {
					delta_x = 0;
					width = ~~(mouse_x - rect.x);
				} else if (x_axis === HANDLE_LEFT) {
					delta_x = ~~(mouse_x - rect.x);
					width = ~~(rect.x + rect.width - mouse_x);
				} else {
					width = ~~(rect.width);
				}
				if (y_axis === HANDLE_BOTTOM) {
					delta_y = 0;
					height = ~~(mouse_y - rect.y);
				} else if (y_axis === HANDLE_TOP) {
					delta_y = ~~(mouse_y - rect.y);
					height = ~~(rect.y + rect.height - mouse_y);
				} else {
					height = ~~(rect.height);
				}
				let new_rect = {
					x: rect.x + delta_x,
					y: rect.y + delta_y,
					width,
					height,
				};

				new_rect.width = Math.max(1, new_rect.width);
				new_rect.height = Math.max(1, new_rect.height);

				// Constraints
				if (options.constrainRect) {
					new_rect = options.constrainRect(new_rect, x_axis, y_axis);
				}
				new_rect.width = Math.max(new_rect.width, options.minOuterWidth ?? 100);
				new_rect.height = Math.max(new_rect.height, options.minOuterHeight ?? 0);
				new_rect.width = Math.max(new_rect.width, (options.minInnerWidth ?? 0) + window_frame_width);
				new_rect.height = Math.max(new_rect.height, (options.minInnerHeight ?? 0) + window_frame_height);
				// prevent free movement via resize past minimum size
				if (x_axis === HANDLE_LEFT) {
					new_rect.x = Math.min(new_rect.x, rect.x + rect.width - new_rect.width);
				}
				if (y_axis === HANDLE_TOP) {
					new_rect.y = Math.min(new_rect.y, rect.y + rect.height - new_rect.height);
				}

				$window_element.css({
					top: new_rect.y,
					left: new_rect.x,
				});
				$window_element.outerWidth(new_rect.width);
				$window_element.outerHeight(new_rect.height);
			}
		});
	}

	win.$Button = (text, handler) => {
		var $b = $(E("button"))
			.appendTo(win.$content)
			.text(text)
			.on("click", () => {
				if (handler) {
					handler();
				}
				win.close();
			});
		return $b;
	};
	/**
	 * @typedef {{
	 * 	(text: string): OSGUI$Window;
	 * 	(): string;
	 * }} titleMethodOverloads
	*/
	// https://github.com/Microsoft/TypeScript/issues/25590#issuecomment-968906682
	win.title = /** @type {titleMethodOverloads} */ ((title) => {
		// title("") should clear the title
		// title(5) should set the title to "5"
		// title() should return the title
		if (typeof title !== "undefined") {
			win.$title.text(title);
			$window_element.trigger("title-change");
			if (win.task) {
				win.task.updateTitle();
			}
			return win;
		} else {
			return win.$title.text();
		}
	});

	win.getTitle = () => {
		return win.title();
	};
	let animating_titlebar = false;
	/**
	 * queue of functions to call when done animating,
	 * so maximize() / minimize() / restore() eventually gives the same result as if there was no animation
	 * @type {(() => void)[]}
	 */
	let when_done_animating_titlebar = [];
	win.animateTitlebar = (from, to, callback = () => { }) => {
		// flying titlebar animation
		animating_titlebar = true;
		const $eye_leader = win.$titlebar.clone(true);
		$eye_leader.find("button").remove();
		$eye_leader.appendTo("body");
		const duration_ms = $Window.OVERRIDE_TRANSITION_DURATION ?? 200; // TODO: how long?
		const duration_str = `${duration_ms}ms`;
		$eye_leader.css({
			transition: `left ${duration_str} linear, top ${duration_str} linear, width ${duration_str} linear, height ${duration_str} linear`,
			position: "fixed",
			zIndex: 10000000,
			pointerEvents: "none",
			left: from.left,
			top: from.top,
			width: from.width,
			height: from.height,
		});
		setTimeout(() => {
			$eye_leader.css({
				left: to.left,
				top: to.top,
				width: to.width,
				height: to.height,
			});
		}, 5);
		let handled_transition_completion = false;
		const handle_transition_completion = () => {
			if (handled_transition_completion) {
				return; // ignore multiple calls (an idempotency pattern)
			} else {
				handled_transition_completion = true;
			}
			animating_titlebar = false;
			$eye_leader.remove();
			callback();
			when_done_animating_titlebar.shift()?.(); // relies on animating_titlebar = false;
		};
		$eye_leader.on("transitionend transitioncancel", handle_transition_completion);
		setTimeout(handle_transition_completion, duration_ms * 1.2);
	};
	/** @param {boolean} [force] */
	win.close = (force) => {
		if (force && force !== true) {
			throw new TypeError("force must be a boolean or undefined, not " + Object.prototype.toString.call(force));
		}
		if (!force) {
			let prevented = false;
			dispatch_before_close({
				preventDefault: () => { prevented = true; }
			});
			if (prevented) {
				return;
			}
			// legacy
			var e = $.Event("close");
			$window_element.trigger(e);
			if (e.isDefaultPrevented()) {
				return;
			}
		}
		if ($component) {
			$component.detach();
		}
		win.closed = true;
		minimize_slots[win._minimize_slot_index] = null;

		dispatch_closed();
		$window_element.trigger("closed");
		// TODO: change usages of "close" to "closed" where appropriate
		// and probably rename the "close" event ("before[-]close"? "may-close"? "close-request"?)

		// MUST be after any events are triggered!
		$window_element.remove();

		// TODO: support modals, which should focus what was focused before the modal was opened.
		// (Note: must consider the element being removed from the DOM, or hidden, or made un-focusable. For consistency, should probably just check if it's in the set of elements considered tabbable... although perhaps with special logic for radio groups?)
		// (Also: modals should steal focus / be brought to the front when focusing the parent window, and the parent window's content should be inert/uninteractive)

		// Focus next-topmost window
		var $next_topmost = $($(".window:visible").toArray().sort((a, b) => b.style.zIndex - a.style.zIndex)[0]);
		$next_topmost.triggerHandler("refocus-window");

		// Cleanup
		clean_up_debug_focus_tracking();
	};
	win.closed = false;

	/** @type {MenuBar | null} */
	let current_menu_bar;
	// @TODO: should this be like setMenus(menu_definitions)?
	// It seems like setMenuBar(menu_bar) might be prone to bugs
	// trying to set the same menu bar on multiple windows.
	win.setMenuBar = (menu_bar) => {
		// win.find(".menus").remove(); // ugly, if only because of the class name haha
		if (current_menu_bar) {
			current_menu_bar.element.remove();
		}
		if (menu_bar) {
			win.$titlebar.after(menu_bar.element);
			menu_bar.setKeyboardScope(win.element);
			current_menu_bar = menu_bar;
		}
	};

	if (options.title) {
		win.title(options.title);
	}

	if (!$component) {
		win.center();
	}

	// mustHaveMethods($w, windowInterfaceMethods);

	return $win;
}

/**
 * @param {string} title
 * @returns {OSGUI$FormWindow}
 */
function $FormWindow(title) {
	var $w = /** @type {OSGUI$FormWindow} */($Window());

	$w.title(title);
	$w.$form = $(E("form")).appendTo($w.$content);
	$w.$main = $(E("div")).appendTo($w.$form);
	$w.$buttons = $(E("div")).appendTo($w.$form).addClass("button-group");

	$w.$Button = (label, action) => {
		var $b = $(E("button")).appendTo($w.$buttons).text(label);
		$b.on("click", (e) => {
			// prevent the form from submitting
			// @TODO: instead, prevent the form's submit event
			e.preventDefault();

			action();
		});

		$b.on("pointerdown", () => {
			$b.focus();
		});

		return $b;
	};

	return $w;
}

exports.$Window = $Window;
exports.$FormWindow = $FormWindow;

})(window);
