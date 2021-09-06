const objects = [];
const n_objects = 10;
const $mothership = new $Window({
	title: 'Mothership',
	outerWidth: 400,
	outerHeight: 300,
});

for (let i = 0; i < n_objects; ++i) {
	const $window = new $Window({
		title: "Window " + i,
		outerWidth: 100,
		outerHeight: 100,
	});
	const motherRect = $mothership.$content[0].getBoundingClientRect();
	const object = {
		x: motherRect.left + motherRect.width / 2,
		y: motherRect.top + motherRect.height / 2,
		velocityX: Math.sin(Date.now() / 1000 + i / n_objects * Math.PI * 2) * 15,
		velocityY: Math.cos(Date.now() / 1000 + i / n_objects * Math.PI * 2) * 15,
		z: i,
		clipping: true,
		crossedDuringThisContainment: false,
		$window,
	};
	objects.push(object);
}
const animate = () => {
	requestAnimationFrame(animate);
	$mothership.css("z-index", 0); // stay under the other windows, for this animation
	const motherRect = $mothership.$content[0].getBoundingClientRect();
	for (let i = 0; i < objects.length; i++) {
		const o = objects[i];
		const $window = o.$window;
		o.x += o.velocityX;
		o.y += o.velocityY;
		o.velocityX *= 0.99;
		o.velocityY *= 0.99;
		const targetX = motherRect.left + motherRect.width / 2 + 100;
		const targetY = motherRect.top + motherRect.height / 2;
		const dist = Math.hypot(targetX - o.x, targetY - o.y);
		o.velocityX += (targetX - o.x) / dist * 0.1;
		o.velocityY += (targetY - o.y) / dist * 0.1;
		// o.velocityX -= (o.x - (motherRect.left + motherRect.width / 2)) * 0.001;
		// o.velocityY -= (o.y - (motherRect.top + motherRect.height / 2)) * 0.001;
		// for (let j = 0; j < objects.length; j++) {
		// 	if (i === j) {
		// 		continue;
		// 	}
		// 	const o2 = objects[j];
		// 	const dist = Math.sqrt(
		// 		Math.pow(o.x - o2.x, 2) + Math.pow(o.y - o2.y, 2)
		// 	);
		// 	o.velocityX += (o.x - o2.x) * 0.1 / dist;
		// 	o.velocityY += (o.y - o2.y) * 0.1 / dist;
		// }
		// const x = ~~o.x;
		// const y = ~~o.y;
		const width = ~~$window.outerWidth();
		const height = ~~$window.outerHeight();
		const x = ~~$window.offset().left;
		const y = ~~$window.offset().top;
		const containedByMothership =
			motherRect.left < x && motherRect.left + motherRect.width > x + width &&
			motherRect.top < y && motherRect.top + motherRect.height > y + height;
		if (
			containedByMothership &&
			objects.every((otherObject) => {
				if (otherObject === o) {
					return true;
				}
				const otherRect = otherObject.$window[0].getBoundingClientRect();
				const ourRect = $window[0].getBoundingClientRect();
				return (
					// The objects must either not be overlapping...
					otherRect.left > ourRect.left + ourRect.width ||
					otherRect.left + otherRect.width < ourRect.left ||
					otherRect.top > ourRect.top + ourRect.height ||
					otherRect.top + otherRect.height < ourRect.top ||
					// ...or, depending on the direction in z the object is supposed to be moving,
					// the other object must not be in the way, in terms of z index.
					((otherObject.z < o.z) === o.clipping) ||
					// Clipping is sort of like another z index. Maybe.
					// At any rate, it's all about physical plausibility,
					// and this is another case where they should be able to cross.
					(o.clipping !== otherObject.clipping)
				);
			})
		) {
			if (!o.crossedDuringThisContainment) {
				o.crossedDuringThisContainment = true;
				o.clipping = !o.clipping;
				objects.sort((a, b) => a.z - b.z);
				objects.sort((a, b) => b.clipping - a.clipping);
				objects.forEach((object, index) => { object.z = index; });
			}
		} else if (!containedByMothership) {
			o.crossedDuringThisContainment = false;
		}
		$window.css({
			// left: x,
			// top: y,
			// width: width,
			// height: height,
			// zIndex: ~~((Math.cos(Date.now() / 1000 + i / n_objects * Math.PI * 2)) * 100),
			zIndex: o.z,
			clipPath: o.clipping ? `polygon(
				${motherRect.left - x}px ${motherRect.top - y}px,
				${motherRect.right - x}px ${motherRect.top - y}px,
				${motherRect.right - x}px ${motherRect.bottom - y}px,
				${motherRect.left - x}px ${motherRect.bottom - y}px
			)` : '',
			// "--ButtonFace": o.clipping ? "#f0a390" : "#f0f390",
		});
	}
};
animate();
