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

	let selecting_menus = false;

	const close_menus = () => {
		$(menus_el).find(".menu-button").trigger("release"); // using jQuery just for events system; @TODO: remove jQuery dependency
		// Close any rogue floating submenus
		const popup_els = document.querySelectorAll(".menu-popup");
		for (const popup_el of popup_els) {
			popup_el.style.display = "none";
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

	// TODO: API for context menus (i.e. floating menu popups)
	function MenuPopup(menu_items) {
		const menu_popup_el = E("div", { class: "menu-popup" });
		const menu_popup_table_el = E("table", { class: "menu-popup-table" });
		menu_popup_el.appendChild(menu_popup_table_el);

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

				if (item.submenu) {
					item_el.classList.add("has-submenu");
					submenu_area_el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 10 11" style="fill:currentColor;display:inline-block;vertical-align:middle"><path d="M7.5 4.33L0 8.66L0 0z"/></svg>';
					setTimeout(() => { // allow time for the menu to be added to the DOM so it can inherit `direction` CSS property if applicable
						if (get_direction() === "rtl") {
							submenu_area_el.querySelector("svg").style.transform = "scaleX(-1)";
						}
					}, 0);

					const submenu_popup_el = MenuPopup(item.submenu).element;
					document.body.appendChild(submenu_popup_el);
					submenu_popup_el.style.display = "none";

					const open_submenu = () => {
						submenu_popup_el.style.display = "";
						$(submenu_popup_el).triggerHandler("update");
						const rect = item_el.getBoundingClientRect();
						let submenu_popup_rect = submenu_popup_el.getBoundingClientRect();
						submenu_popup_el.style.position = "absolute";
						submenu_popup_el.style.right = "unset"; // needed for RTL layout
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
						menu_popup_el.closest(".menu-container").querySelector(".menu-button").focus();
						if (open_tid) { clearTimeout(open_tid); }
						if (close_tid) { clearTimeout(close_tid); }
						close_tid = setTimeout(() => {
							submenu_popup_el.style.display = "none";
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
						// may not exist for submenu popups
						const menu_button = $(menu_popup_el).closest(".menu-container").find(".menu-button")[0];
						if (menu_button) {
							menu_button.focus();
						}
					}
				});

				$(item_el).on("keydown", e => {
					if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
						return;
					}
					if (e.keyCode === 13) { // Enter
						e.preventDefault();
						item_action();
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
	const make_menu = (menus_key, menu_items) => {
		const menu_container_el = E("div", { class: "menu-container" });
		const menu_button_el = E("div", { class: "menu-button" });
		menus_el.appendChild(menu_container_el);
		menu_container_el.appendChild(menu_button_el);

		const menu_popup_el = MenuPopup(menu_items).element;
		menu_container_el.appendChild(menu_popup_el);

		const update_position_from_containing_bounds = () => {
			menu_popup_el.style.left = "unset";
			menu_popup_el.style.right = "unset"; // needed for RTL layout
			const uncorrected_rect = menu_popup_el.getBoundingClientRect();
			// rounding down is needed for RTL layout for the rightmost menu
			if (Math.floor(uncorrected_rect.right) > innerWidth) {
				menu_popup_el.style.left = `${innerWidth - uncorrected_rect.width - uncorrected_rect.left}px`;
			}
			if (Math.ceil(uncorrected_rect.left) < 0) {
				menu_popup_el.style.left = "0px";
			}
		};
		$G.on("resize", update_position_from_containing_bounds);
		$(menu_popup_el).on("update", update_position_from_containing_bounds);
		update_position_from_containing_bounds();

		const menu_id = menus_key.replace("&", "").replace(/ /g, "-").toLowerCase();
		menu_button_el.classList.add(`${menu_id}-menu-button`);

		menu_popup_el.style.display = "none";
		menu_button_el.innerHTML = display_hotkey(menus_key);
		menu_button_el.tabIndex = -1;
		$(menu_container_el).on("keydown", e => {
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
						// @TODO: enter sub-submenus; this only works for the first level
						document.querySelector(".menu-popup .menu-item").focus(); // first item
						e.preventDefault();
					} else {
						// go to next/previous menu
						const next_previous = ((get_direction() === "ltr") === right) ? "next" : "previous";
						const target_button_el = menu_container_el[`${next_previous}ElementSibling`]?.querySelector(".menu-button");
						if (target_button_el) {
							$(target_button_el).trigger("pointerdown");
						}
					}
					break;
				case 40: // Down
					if (visible(menu_popup_el) && focused_item_el) {
						let next_el = focused_item_el.nextElementSibling;
						while (next_el && !next_el.classList.contains("menu-item")) {
							next_el = next_el.nextElementSibling;
						}
						next_el?.focus();
					} else {
						$(menu_button_el).trigger("pointerdown");
						menu_popup_el.querySelector(".menu-item").focus(); // first item
					}
					break;
				case 38: // Up
					if (visible(menu_popup_el) && focused_item_el) {
						let prev_el = focused_item_el.previousElementSibling;
						while (prev_el && !prev_el.classList.contains("menu-item")) {
							prev_el = prev_el.previousElementSibling;
						}
						prev_el?.focus();
					} else {
						$(menu_button_el).trigger("pointerdown"); // or maybe do nothing?
						const menu_items = menu_popup_el.querySelectorAll(".menu-item");
						menu_items[menu_items.length - 1].focus(); // last item
					}
					break;
			}
		});
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
					$(menu_button_el).trigger("pointerdown");
				}
			}
		});
		$(menu_button_el).on("pointerdown pointerover", e => {
			if (e.type === "pointerover" && !selecting_menus) {
				return;
			}
			if (e.type !== "pointerover") {
				if (!menu_button_el.classList.contains("active")) {
					this_click_opened_the_menu = true;
				}
			}

			close_menus();

			menu_button_el.focus();
			menu_button_el.classList.add("active");
			menu_popup_el.style.display = "";
			// menu_popup_el.dispatchEvent(new CustomEvent("update")); // TODO: do stuff like this, for example.
			$(menu_popup_el).trigger("update");

			selecting_menus = true;

			$menus.triggerHandler("info", "");
		});
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
			menu_popup_el.style.display = "none";

			$menus.triggerHandler("default-info");
		});
	};
	for (const menu_key in menus) {
		make_menu(menu_key, menus[menu_key]);
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
