((exports) => {

function E(nodeName, attrs) {
	const el = document.createElement(nodeName);
	if (attrs) {
		for (const key in attrs) {
			if (key === "class") {
				el.className = attrs[key];
			} else {
				el.setAttribute(key, attrs[key]);
			}
		}
	}
	return el;
}

// straight from jQuery; @TODO: do something simpler
function visible(elem) {
	return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
}

// @TODO: DRY hotkey helpers with jspaint (export them?)

// & defines accelerators (hotkeys) in menus and buttons and things, which get underlined in the UI.
// & can be escaped by doubling it, e.g. "&Taskbar && Start Menu"
function index_of_hotkey(text) {
	// Returns the index of the ampersand that defines a hotkey, or -1 if not present.

	// return english_text.search(/(?<!&)&(?!&|\s)/); // not enough browser support for negative lookbehind assertions

	// The space here handles beginning-of-string matching and counteracts the offset for the [^&] so it acts like a negative lookbehind
	return ` ${text}`.search(/[^&]&[^&\s]/);
}
// function has_hotkey(text) {
// 	return index_of_hotkey(text) !== -1;
// }
// function remove_hotkey(text) {
// 	return text.replace(/\s?\(&.\)/, "").replace(/([^&]|^)&([^&\s])/, "$1$2");
// }
function display_hotkey(text) {
	// TODO: use a more general term like .hotkey or .accelerator?
	return text.replace(/([^&]|^)&([^&\s])/, "$1<span class='menu-hotkey'>$2</span>").replace(/&&/g, "&");
}
function get_hotkey(text) {
	return text[index_of_hotkey(text) + 1].toUpperCase();
}

// TODO: support copy/pasting text in the text tool textarea from the menus
// probably by recording document.activeElement on pointer down,
// and restoring focus before executing menu item actions.

const MENU_DIVIDER = "MENU_DIVIDER";

const MAX_MENU_NESTING = 1000;

const internal_z_counter = 1;
function get_new_menu_z_index() {
	// integrate with the OS window z-indexes, if applicable
	// but don't depend on $Window existing, the modules should be independent
	if (typeof $Window !== "undefined") {
		return ($Window.Z_INDEX++) + MAX_MENU_NESTING; // MAX_MENU_NESTING is needed because the window gets brought to the top
	}
	return (++internal_z_counter) + MAX_MENU_NESTING;
}
	
function MenuBar(menus) {
	if (!(this instanceof MenuBar)) {
		return new MenuBar(menus);
	}

	const $ = jQuery;
	const $G = $(self);

	const menus_el = E("div", { class: "menus", "touch-action": "none" });
	const $menus = $(menus_el);

	// returns writing/layout direction, "ltr" or "rtl"
	function get_direction() {
		return window.get_direction ? window.get_direction() : getComputedStyle(menus_el).direction;
	}

	let selecting_menus = false; // state where you can glide between menus without clicking

	let active_menu_index = -1; // index of the top level menu that's most recently open

	// There can be multiple menu bars instantiated from the same menu definitions,
	// so this can't be a map of menu item to submenu, it has to be of menu item ELEMENTS to submenu.
	// (or you know, it could work totally differently, this is just one way obviously)
	// This is for entering submenus.
	const submenu_popups_by_menu_item_el = new Map();

	// This is for exiting submenus.
	const parent_item_el_by_popup_el = new Map();

	const any_open_menus = ()=> !!document.querySelector(".menu-popup"); // @TODO: specific to this menu bar (note that popups are not descendants of the menu bar)
	const close_menus = () => {
		$(menus_el).find(".menu-button").trigger("release"); // using jQuery just for events system; @TODO: remove jQuery dependency
		// Close any rogue floating submenus
		const popup_els = document.querySelectorAll(".menu-popup");
		for (const popup_el of popup_els) {
			if (!window.debugKeepMenusOpen) {
				popup_el.style.display = "none";
			}
		}
	};

	const is_disabled = item => {
		if (typeof item.enabled === "function") {
			return !item.enabled();
		} else if (typeof item.enabled === "boolean") {
			return !item.enabled;
		} else {
			return false;
		}
	};

	const top_level_menus = [];
	
	// attached to menu bar and floating popups (which are not descendants of the menu bar)
	function handleKeyDown(e) {
		if (e.defaultPrevented) {
			return;
		}
		const active_menu_popup_el = e.target.closest(".menu-popup");
		const top_level_menu = top_level_menus[active_menu_index];
		const { menu_button_el, maybe_toggle_menu } = top_level_menu;
		// console.log("keydown", e.key, { target: e.target, active_menu_popup_el, top_level_menu });
		const menu_popup_el = active_menu_popup_el || top_level_menu.menu_popup_el;
		const parent_item_el = parent_item_el_by_popup_el.get(active_menu_popup_el);
		const focused_item_el = menu_popup_el.querySelector(".menu-item:focus");

		switch (e.keyCode) {
			case 37: // Left
			case 39: // Right
				const right = e.keyCode === 39;
				if (
					focused_item_el?.classList.contains("has-submenu") &&
					(get_direction() === "ltr") === right
				) {
					// enter submenu
					$(focused_item_el).trigger("click");
					// focus first item in submenu
					const submenu_popup = submenu_popups_by_menu_item_el.get(focused_item_el);
					submenu_popup.element.querySelector(".menu-item").focus();
					e.preventDefault();
				} else if (
					parent_item_el &&
					!parent_item_el.classList.contains("menu-button") && // left/right doesn't make sense to close the top level menu
					(get_direction() === "ltr") !== right
				) {
					// exit submenu
					parent_item_el.focus();
					active_menu_popup_el.style.display = "none";
					e.preventDefault();
				} else {
					// go to next/previous top level menu, wrapping around
					// and open a new menu only if a menu was already open
					const menu_was_open = visible(menu_popup_el);
					const cycle_dir = ((get_direction() === "ltr") === right) ? 1 : -1;
					const new_index = (active_menu_index + cycle_dir + top_level_menus.length) % top_level_menus.length;
					const new_top_level_menu = top_level_menus[new_index];
					const target_button_el = new_top_level_menu.menu_button_el;
					if (menu_was_open) {
						new_top_level_menu.maybe_toggle_menu("pointerdown");
						new_top_level_menu.menu_popup_el.querySelector(".menu-item").focus();
					} else {
						$(menu_button_el).trigger("release");
						target_button_el.focus();
					}
					e.preventDefault();
				}
				break;
			case 40: // Down
				if (menu_popup_el && visible(menu_popup_el) && focused_item_el) {
					let next_el = focused_item_el.nextElementSibling;
					while (next_el && !next_el.classList.contains("menu-item")) {
						next_el = next_el.nextElementSibling;
					}
					next_el?.focus();
					// @TODO: wrap around
				} else {
					maybe_toggle_menu("pointerdown");
					menu_popup_el.querySelector(".menu-item").focus(); // first item
				}
				e.preventDefault();
				break;
			case 38: // Up
				if (menu_popup_el && visible(menu_popup_el) && focused_item_el) {
					let prev_el = focused_item_el.previousElementSibling;
					while (prev_el && !prev_el.classList.contains("menu-item")) {
						prev_el = prev_el.previousElementSibling;
					}
					prev_el?.focus();
					// @TODO: wrap around
				} else {
					maybe_toggle_menu("pointerdown");
					// @TODO: actually in Windows 98, it focuses the first item, not the last
					const menu_items = menu_popup_el.querySelectorAll(".menu-item");
					menu_items[menu_items.length - 1].focus(); // last item
				}
				e.preventDefault();
				break;
			case 27: // Escape
				if (any_open_menus()) {
					// (@TODO: doesn't parent_item_el always exist?)
					if (parent_item_el && parent_item_el !== menu_button_el) {
						parent_item_el.focus();
						active_menu_popup_el.style.display = "none";
					} else {
						// close_menus takes care of releasing the pressed state of the button as well
						close_menus();
						menu_button_el.focus();
					}
					e.preventDefault();
				}
				break;
			case 32: // Space
				// opens system menu in Windows 98
				// (at top level)
				break;
			case 13: // Enter
				// Enter is handled elsewhere, except for top level buttons
				if (menu_button_el === document.activeElement) {
					maybe_toggle_menu("pointerdown");
					menu_popup_el.querySelector(".menu-item").focus(); // first item
					e.preventDefault();
				}
				break;
		}
	}

	menus_el.addEventListener("keydown", handleKeyDown);

	// TODO: API for context menus (i.e. floating menu popups)
	function MenuPopup(menu_items) {
		const menu_popup_el = E("div", { class: "menu-popup", id: `menu-popup-${Math.random().toString(36).substr(2, 9)}` });
		const menu_popup_table_el = E("table", { class: "menu-popup-table" });
		menu_popup_el.appendChild(menu_popup_table_el);

		menu_popup_el.addEventListener("keydown", handleKeyDown);

		menu_items.forEach(item => {
			const row_el = E("tr", { class: "menu-row" });
			menu_popup_table_el.appendChild(row_el);
			if (item === MENU_DIVIDER) {
				const td_el = E("td", { colspan: 4 });
				const hr_el = E("hr", { class: "menu-hr" });
				td_el.appendChild(hr_el);
				row_el.appendChild(td_el);
			} else {
				const item_el = row_el;
				item_el.classList.add("menu-item");
				item_el.setAttribute("tabIndex", -1);
				const checkbox_area_el = E("td", { class: "menu-item-checkbox-area" });
				const label_el = E("td", { class: "menu-item-label" });
				const shortcut_el = E("td", { class: "menu-item-shortcut" });
				const submenu_area_el = E("td", { class: "menu-item-submenu-area" });

				item_el.appendChild(checkbox_area_el);
				item_el.appendChild(label_el);
				item_el.appendChild(shortcut_el);
				item_el.appendChild(submenu_area_el);

				label_el.innerHTML = display_hotkey(item.item);
				shortcut_el.textContent = item.shortcut;

				item_el._menu_item = item;

				$(menu_popup_el).on("update", () => {
					// item_el.disabled = is_disabled(item); // doesn't work, probably because it's a <tr>
					if (is_disabled(item)) {
						item_el.setAttribute("disabled", "");
					} else {
						item_el.removeAttribute("disabled");
					}
					if (item.checkbox && item.checkbox.check) {
						checkbox_area_el.textContent = item.checkbox.check() ? "✓" : "";
					}
				});
				$(item_el).on("pointerover", () => {
					$(menu_popup_el).triggerHandler("update");
					item_el.focus();
				});

				if (item.checkbox) {
					checkbox_area_el.textContent = "✓";
				}

				let open_submenu, submenu_popup_el;
				if (item.submenu) {
					item_el.classList.add("has-submenu");
					submenu_area_el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 10 11" style="fill:currentColor;display:inline-block;vertical-align:middle"><path d="M7.5 4.33L0 8.66L0 0z"/></svg>';

					const submenu_popup = MenuPopup(item.submenu);
					submenu_popup_el = submenu_popup.element;
					document.body.appendChild(submenu_popup_el);
					submenu_popup_el.style.display = "none";

					submenu_popups_by_menu_item_el.set(item_el, submenu_popup);
					parent_item_el_by_popup_el.set(submenu_popup_el, item_el);
					submenu_popup_el.dataset.semanticParent = menu_popup_el.id; // for $Window to understand the popup belongs to its window

					open_submenu = () => {
						submenu_popup_el.style.display = "";
						submenu_popup_el.style.zIndex = get_new_menu_z_index();
						submenu_popup_el.setAttribute("dir", get_direction());
						submenu_area_el.querySelector("svg").style.transform = get_direction() === "rtl" ? "scaleX(-1)" : "";
						
						// console.log("open_submenu — submenu_popup_el.style.zIndex", submenu_popup_el.style.zIndex, "$Window.Z_INDEX", $Window.Z_INDEX, "menus_el.closest('.window').style.zIndex", menus_el.closest(".window").style.zIndex);
						// setTimeout(() => { console.log("after timeout, menus_el.closest('.window').style.zIndex", menus_el.closest(".window").style.zIndex); }, 0);
						$(submenu_popup_el).triggerHandler("update");
						const rect = item_el.getBoundingClientRect();
						let submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
						submenu_popup_el.style.position = "absolute";
						submenu_popup_el.style.left = `${(get_direction() === "rtl" ? rect.left - submenu_popup_rect.width : rect.right) + window.scrollX}px`;
						submenu_popup_el.style.top = `${rect.top + window.scrollY}px`;

						submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
						// This is surely not the cleanest way of doing this,
						// and the logic is not very robust in the first place,
						// but I want to get RTL support done and so I'm mirroring this in the simplest way possible.
						if (get_direction() === "rtl") {
							if (submenu_popup_rect.left < 0) {
								submenu_popup_el.style.left = `${rect.right}px`;
								submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
								if (submenu_popup_rect.right > innerWidth) {
									submenu_popup_el.style.left = `${innerWidth - submenu_popup_rect.width}px`;
								}
							}
						} else {
							if (submenu_popup_rect.right > innerWidth) {
								submenu_popup_el.style.left = `${rect.left - submenu_popup_rect.width}px`;
								submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
								if (submenu_popup_rect.left < 0) {
									submenu_popup_el.style.left = "0";
								}
							}
						}
					};
					let open_tid, close_tid;
					$(item_el).add(submenu_popup_el).on("pointerover", () => {
						if (open_tid) { clearTimeout(open_tid); }
						if (close_tid) { clearTimeout(close_tid); }
					});
					$(item_el).on("pointerover", () => {
						if (open_tid) { clearTimeout(open_tid); }
						if (close_tid) { clearTimeout(close_tid); }
						open_tid = setTimeout(open_submenu, 200);
					});
					$(item_el).add(submenu_popup_el).on("pointerout", () => {
						parent_item_el_by_popup_el.get(submenu_popup_el).focus();
						// @TODO: keep submenu open while mouse is outside any menus,
						// close it when hovering a different higher level menu after a delay unless the mouse returns to the submenu
						// Keep outer menu open as long as any submenus are open.
						// Highlight the submenu-containing item while the submenu is open, unless hovering over a different higher level menu.
						// Also submenus should get focus once they open (but not focus any item within). Or at least, down arrow should focus the first item once it's open, rather than moving in the outer menu.

						if (open_tid) { clearTimeout(open_tid); }
						if (close_tid) { clearTimeout(close_tid); }
						close_tid = setTimeout(() => {
							if (!window.debugKeepMenusOpen) {
								submenu_popup_el.style.display = "none";
							}
						}, 200);
					});
					$(item_el).on("click pointerdown", open_submenu);
				}

				const item_action = () => {
					if (item.checkbox) {
						if (item.checkbox.toggle) {
							item.checkbox.toggle();
						}
						$(menu_popup_el).triggerHandler("update");
					} else if (item.action) {
						close_menus();
						item.action();
					}
				};
				$(item_el).on("pointerup", e => {
					if (e.pointerType === "mouse" && e.button !== 0) {
						return;
					}
					item_action();
				});
				$(item_el).on("pointerover", () => {
					if (item.submenu) {
						$menus.triggerHandler("info", "");
					} else {
						$menus.triggerHandler("info", item.description || "");
					}
				});
				$(item_el).on("pointerout", () => {
					if (visible(item_el)) {
						$menus.triggerHandler("info", "");
						parent_item_el_by_popup_el.get(menu_popup_el)?.focus();
					}
				});

				$(item_el).on("keydown", e => {
					if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
						return;
					}
					if (e.keyCode === 13) { // Enter
						e.preventDefault();
						if (item.submenu) {
							// this isn't part of item_action because it shouldn't happen on click
							open_submenu();
							// focus first item in submenu
							submenu_popup_el.querySelector(".menu-item").focus();
						} else {
							item_action();
						}
					}
				});

				$(menu_popup_el).on("keydown", e => {
					if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
						return;
					}
					if (String.fromCharCode(e.keyCode) === get_hotkey(item.item)) {
						e.preventDefault();
						$(item_el).trigger("click");
					}
				});
			}
		});

		return { element: menu_popup_el };
	}

	let this_click_opened_the_menu = false;
	const make_menu_button = (menus_key, menu_items) => {
		const menu_button_el = E("div", { class: "menu-button", "aria-expanded": "false" });

		menus_el.appendChild(menu_button_el);

		const menu_popup = MenuPopup(menu_items);
		const menu_popup_el = menu_popup.element;
		document.body.appendChild(menu_popup_el);
		submenu_popups_by_menu_item_el.set(menu_button_el, menu_popup);
		parent_item_el_by_popup_el.set(menu_popup_el, menu_button_el);
		menu_button_el.id = `menu-button-${menus_key}-${Math.random().toString(36).substr(2, 9)}`;
		menu_popup_el.dataset.semanticParent = menu_button_el.id; // for $Window to understand the popup belongs to its window

		const update_position_from_containing_bounds = () => {
			const rect = menu_button_el.getBoundingClientRect();
			let popup_rect = menu_popup_el.getBoundingClientRect();
			menu_popup_el.style.position = "absolute";
			menu_popup_el.style.left = `${(get_direction() === "rtl" ? rect.right - popup_rect.width : rect.left) + window.scrollX}px`;
			menu_popup_el.style.top = `${rect.bottom + window.scrollY}px`;

			const uncorrected_rect = menu_popup_el.getBoundingClientRect();
			// rounding down is needed for RTL layout for the rightmost menu, to prevent a scrollbar
			if (Math.floor(uncorrected_rect.right) > innerWidth) {
				menu_popup_el.style.left = `${innerWidth - uncorrected_rect.width}px`;
			}
			if (Math.ceil(uncorrected_rect.left) < 0) {
				menu_popup_el.style.left = "0px";
			}
		};
		$G.on("resize", update_position_from_containing_bounds);
		$(menu_popup_el).on("update", update_position_from_containing_bounds);
		// update_position_from_containing_bounds(); // will be called when the menu is opened

		const menu_id = menus_key.replace("&", "").replace(/ /g, "-").toLowerCase();
		menu_button_el.classList.add(`${menu_id}-menu-button`);
		// menu_popup_el.id = `${menu_id}-menu-popup-${Math.random().toString(36).substr(2, 9)}`; // id is created by MenuPopup and changing it breaks the data-semantic-parent relationship
		menu_popup_el.style.display = "none";
		menu_button_el.innerHTML = display_hotkey(menus_key);
		menu_button_el.tabIndex = -1;
		
		menu_button_el.setAttribute("aria-haspopup", "true");
		menu_button_el.setAttribute("aria-controls", menu_popup_el.id);

		// @TODO: allow setting scope for alt shortcuts, like menuBar.setHotkeyScope(windowElement||window)
		// and add a helper to $Window to set up a menu bar, like $window.setMenuBar(menuBar||null)
		$G.on("keydown", e => {
			if (e.ctrlKey || e.metaKey) { // Ctrl or Command held
				if (e.keyCode !== 17 && e.keyCode !== 91 && e.keyCode !== 93 && e.keyCode !== 224) { // anything but Ctrl or Command pressed
					close_menus();
				}
				return;
			}
			if (e.altKey) {
				if (String.fromCharCode(e.keyCode) === get_hotkey(menus_key)) {
					e.preventDefault();
					maybe_toggle_menu("pointerdown");
				}
			}
		});
		$(menu_button_el).on("focus", () => {
			active_menu_index = Object.keys(menus).indexOf(menus_key);
		});
		$(menu_button_el).on("pointerdown pointerover", e => {
			maybe_toggle_menu(e.type);
		});
		function maybe_toggle_menu(type) {
			if (type === "pointerover" && !selecting_menus) {
				return;
			}
			if (type !== "pointerover") {
				if (!menu_button_el.classList.contains("active")) {
					this_click_opened_the_menu = true;
				}
			}

			close_menus();

			menu_button_el.focus();
			menu_button_el.classList.add("active");
			menu_button_el.setAttribute("aria-expanded", "true");
			menu_popup_el.style.display = "";
			menu_popup_el.style.zIndex = get_new_menu_z_index();
			menu_popup_el.setAttribute("dir", get_direction());
			// console.log("pointerdown (possibly simulated) — menu_popup_el.style.zIndex", menu_popup_el.style.zIndex, "$Window.Z_INDEX", $Window.Z_INDEX, "menus_el.closest('.window').style.zIndex", menus_el.closest(".window").style.zIndex);
			// setTimeout(() => { console.log("after timeout, menus_el.closest('.window').style.zIndex", menus_el.closest(".window").style.zIndex); }, 0);
			active_menu_index = Object.keys(menus).indexOf(menus_key);
			// menu_popup_el.dispatchEvent(new CustomEvent("update")); // TODO: do stuff like this, for example.
			$(menu_popup_el).trigger("update");

			selecting_menus = true;

			$menus.triggerHandler("info", "");
		};
		$(menu_button_el).on("pointerup", () => {
			if (this_click_opened_the_menu) {
				this_click_opened_the_menu = false;
				return;
			}
			if (menu_button_el.classList.contains("active")) {
				close_menus();
			}
		});
		$(menu_button_el).on("release", () => {
			selecting_menus = false;

			menu_button_el.classList.remove("active");
			if (!window.debugKeepMenusOpen) {
				menu_popup_el.style.display = "none";
			}
			menu_button_el.setAttribute("aria-expanded", "false");

			$menus.triggerHandler("default-info");
		});
		top_level_menus.push({
			menu_button_el,
			menu_popup_el,
			menus_key,
			maybe_toggle_menu,
		});
	};
	for (const menu_key in menus) {
		make_menu_button(menu_key, menus[menu_key]);
	}

	$G.on("keypress", e => {
		if (e.keyCode === 27) { // Esc
			close_menus();
		}
	});
	$G.on("blur", () => {
		// window.console && console.log("blur", e.target, document.activeElement);
		close_menus();
	});
	$G.on("pointerdown pointerup", e => {
		if (!e.target.closest(".menus, .menu-popup")) {
			// window.console && console.log(e.type, "occurred outside of menus (on ", e.target, ") so...");
			close_menus();
		}
	});

	this.element = menus_el;
}

function $MenuBar(menus) {
	console?.warn?.("$MenuBar is deprecated. Use `new MenuBar(menus).element` instead.");
	return jQuery(new MenuBar(menus).element);
}

exports.MenuBar = MenuBar;
exports.$MenuBar = $MenuBar;
exports.MENU_DIVIDER = MENU_DIVIDER;

})(window);
