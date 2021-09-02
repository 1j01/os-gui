for (const w of document.querySelectorAll(".window")) {
	graphic_glitch(w);
}
function graphic_glitch(w) {
	var pos_history = [];
	var feOffsets = [];
	var max_pos_history = 100;
	var filter_id = `graphic-glitch-${Math.random()}`;
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
	var filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
	filter.id = filter_id;
	document.body.appendChild(svg);
	svg.appendChild(defs);
	defs.appendChild(filter);
	filter.setAttribute("x", "-100%");
	filter.setAttribute("y", "-100%");
	filter.setAttribute("width", "300%");
	filter.setAttribute("height", "300%");
	var animate = ()=> {
		requestAnimationFrame(animate);
		var current_rect = w.getBoundingClientRect();
		var current_pos = [current_rect.left, current_rect.top];
		if (pos_history.length > max_pos_history) {
			pos_history.length = 0;
			feOffsets.length = 0;
			while (filter.lastChild) {
				filter.removeChild(filter.lastChild);
			}
		}
		if (pos_history.length < 1) {
			pos_history.push(current_pos);
		}
		var latest_recorded_pos = pos_history[pos_history.length - 1];
		if (latest_recorded_pos[0] !== current_pos[0] || latest_recorded_pos[1] !== current_pos[1]) {
			pos_history.push(current_pos);

			var index = pos_history.length - 1;
			var feOffset = document.createElementNS("http://www.w3.org/2000/svg", "feOffset");
			var feBlend = document.createElementNS("http://www.w3.org/2000/svg", "feBlend");
			feOffset.setAttribute("in", "SourceGraphic");
			feOffset.setAttribute("result", `offset${index}`);
			feBlend.setAttribute("in", `${index === 0 ? "SourceGraphic" : `offset${index}`}`);
			feBlend.setAttribute("in2", `smear${index - 1}`);
			feBlend.setAttribute("result", `smear${index}`);
			filter.appendChild(feOffset);
			filter.appendChild(feBlend);
			feOffsets.push(feOffset);

			if (!w.style.filter) {
				w.style.filter = `url(#${filter_id})`;
			}

			for (let i = 0; i < feOffsets.length; i++) {
				const feOffset = feOffsets[i];
				const [x, y] = pos_history[i];
				feOffset.setAttribute("dx", x - current_pos[0]);
				feOffset.setAttribute("dy", y - current_pos[1]);
			}

			filter.setAttribute("x", Math.min(0, 10-current_rect.left));
			filter.setAttribute("y", Math.min(0, 10-current_rect.top));
			filter.setAttribute("width", innerWidth);
			filter.setAttribute("height", innerHeight);
		}
	};
	animate();
}

// TODO:
// - note: don't work on this waste of time
// - add final feMerge with SourceImage (create once, append to end after anything else appended to filter) to fix occasional offset mismatch for window visible vs interactive coordinates
// - occlusion culling for performance 🤦️haha
// - research / optimize with Custom Filters AKA CSS Shaders (can it be done just as a vertex shader?)
// - teardown (allow code to be iterated on without page refresh, and manually disabled)
// - clean up on browser resize, window minimize/maximize/restore, extreme lag
// - hit test element to make sure it's clickable (with getElementFromPoint), and clean up if it's not
// 	- not sure if this lines up with whether it's actually user-clickable in the case of filters fucking it up
// - instead of getBoundingClientRect, use offsetLeft/transform based recursive function to get position, as I think filters can affect the bounding rect in some cases in some browsers
// - in chrome, fix cut off at edge of screen somehow? firefox works nicer although slower, chrome is faster although cutting corners it seems
// - use crypto random for css id haha (or global persistent incrementor)
