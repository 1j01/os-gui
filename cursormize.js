
function enableCursorTheming() {
	let last_cursor_el = null;
	let original_cursor = null;
	let debug_rect_els = [];
	let debug = false;
	// TODO: also handle scroll, elements being removed, pointer capture, etc.
	addEventListener("mousemove", (e) => {
		for (const debug_rect_el of debug_rect_els) {
			debug_rect_el.remove();
		}
		// TODO: optimize for non-"auto" cursor values
		// could even use mouseover, and only use mousemove if cursor is "auto" (not sure that'd be faster though)
		// if (e.target === last_cursor_el && !auto_cursor) {
		// 	return;
		// }
		if (last_cursor_el) {
			last_cursor_el.style.cursor = original_cursor;
		}
		last_cursor_el = e.target;
		original_cursor = e.target.style.cursor; // not computed style, so it resets naturally
		const computed_style = getComputedStyle(e.target);
		let cursor = computed_style.cursor;
		// console.log(cursor);

		if (cursor.startsWith("url")) {
			return;
		}
		
		if (cursor === "auto") {
			if (e.target.tagName === "A" && e.target.href) {
				cursor = "pointer";
			} else if (computed_style.userSelect === "none") {
				cursor = "default";
			} else {
				// may be "text" or "default"
				for (const node of e.target.childNodes) {
					if (node.nodeType === Node.TEXT_NODE) {
						const range = document.createRange();
						range.selectNode(node);
						const rects = range.getClientRects();
						for (const rect of rects) {
							// top/left: inclusive, bottom/right: exclusive
							const inside = e.clientX >= rect.left && e.clientX < rect.right && e.clientY >= rect.top && e.clientY < rect.bottom;
							// const inside = rect.left <= e.clientX && e.clientX <= rect.right && rect.top <= e.clientY && e.clientY <= rect.bottom;
							if (inside) {
								cursor = "text";
								if (!debug) {
									break;
								}
							}
							if (debug) {
								const debug_rect_el = document.createElement("div");
								debug_rect_el.style.position = "fixed";
								debug_rect_el.style.left = `${rect.left}px`;
								debug_rect_el.style.top = `${rect.top}px`;
								debug_rect_el.style.width = `${rect.width}px`;
								debug_rect_el.style.height = `${rect.height}px`;
								debug_rect_el.style.border = `3px dashed ${inside ? "lime" : "red"}`;
								debug_rect_el.style.boxSizing = "border-box";
								debug_rect_el.style.pointerEvents = "none";
								debug_rect_el.style.zIndex = 1000000;
								document.body.appendChild(debug_rect_el);
								debug_rect_els.push(debug_rect_el);
							}
						}
						if (cursor === "text" && !debug) {
							break;
						}
					}
				}
				if (cursor === "auto") {
					cursor = "default";
				}
			}
			// console.log("auto ->", cursor);
		}

		cursor = `var(--cursor-${cursor}), ${cursor}`;
	});
};