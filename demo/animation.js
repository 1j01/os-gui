const repel_force_slider = document.getElementById("repel-force-slider");
const gravity_force_slider = document.getElementById("gravity-force-slider");
const pause_checkbox = document.getElementById("pause-checkbox");

if (!repel_force_slider || !gravity_force_slider || !pause_checkbox) {
	throw new Error("Couldn't find the sliders or checkbox");
}
if (!(repel_force_slider instanceof HTMLInputElement) || !(gravity_force_slider instanceof HTMLInputElement) || !(pause_checkbox instanceof HTMLInputElement)) {
	throw new Error("Unexpected type for the sliders or checkbox");
}

const $mothership = new $Window({
	title: 'Mothership',
	outerWidth: 400,
	outerHeight: 300,
	resizable: true,
});
$mothership.$content.css({
	backgroundImage: "url('https://i.postimg.cc/VLVk5Cm6/image.png')",
	backgroundSize: "cover",
	backgroundRepeat: "no-repeat",
	backgroundPosition: "center",
});

const ship_image_urls = [
	"https://i.postimg.cc/ncJhmJD8/ship5.png",
	"https://i.postimg.cc/0jp54thH/ship6.png",
	"https://i.postimg.cc/nV7LMzMY/spiked-ship-3-small-blue.png",
	"https://i.postimg.cc/sXsTS1sQ/ship-16-colour-transparent.png",
	"https://i.postimg.cc/pTCqBxL0/Spaceship-tut.png",
];
/** 
 * @type {{
 * 	x: number,
 * 	y: number,
 * 	velocityX: number,
 * 	velocityY: number,
 * 	z: number,
 * 	clipping: boolean,
 * 	crossedDuringThisContainment: boolean,
 * 	$window: OSGUI$Window,
 * 	lagged_x?: number,
 * 	lagged_y?: number,
 * 	prev_x?: number,
 * 	prev_y?: number,
 * }[]}
 */
const objects = [];
const n_objects = ship_image_urls.length * 2;

for (let i = 0; i < n_objects; ++i) {
	const $window = new $Window({
		title: "Ship " + i,
	});
	$window.$content.append(
		$("<img>")
			.attr("src", ship_image_urls[i % ship_image_urls.length])
			.css({
				maxWidth: 100,
				margin: "auto", // just in case you maximize the window
			})
			.on("load", () => {
				$window.$content.css({
					minWidth: Math.max($window.$content.width(), $window.$content.height()),
					minHeight: Math.max($window.$content.width(), $window.$content.height()),
					display: "flex",
				});
			})
	);

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
	$($mothership.element).css("z-index", 0); // stay under the other windows, for this animation
	const motherRect = $mothership.$content[0].getBoundingClientRect();
	for (let i = 0; i < objects.length; i++) {
		const o = objects[i];
		const $window = o.$window;
		if (!pause_checkbox.checked) {
			o.x += o.velocityX;
			o.y += o.velocityY;
			o.velocityX *= 0.999;
			o.velocityY *= 0.999;
			const targetX = motherRect.left + motherRect.width / 2 + 100;
			const targetY = motherRect.top + motherRect.height / 2;
			const dist = Math.hypot(targetX - o.x, targetY - o.y);
			const repelForce = repel_force_slider.valueAsNumber / 100;
			o.velocityX -= (targetX - o.x) / dist * repelForce;
			o.velocityY -= (targetY - o.y) / dist * repelForce;

			const gravityForce = gravity_force_slider.valueAsNumber / 20000;
			o.velocityX -= (o.x - (motherRect.left + motherRect.width / 2)) * gravityForce;
			o.velocityY -= (o.y - (motherRect.top + motherRect.height / 2)) * gravityForce;
			for (let j = 0; j < objects.length; j++) {
				if (i === j) {
					continue;
				}
				const o2 = objects[j];
				const dist = Math.sqrt(
					Math.pow(o.x - o2.x, 2) + Math.pow(o.y - o2.y, 2)
				);
				o.velocityX += (o.x - o2.x) * 0.1 / dist;
				o.velocityY += (o.y - o2.y) * 0.1 / dist;
			}
		}
		const x = pause_checkbox.checked ? ~~$($window.element).offset().left : ~~o.x;
		const y = pause_checkbox.checked ? ~~$($window.element).offset().top : ~~o.y;
		const width = ~~$($window.element).outerWidth();
		const height = ~~$($window.element).outerHeight();
		const containedByMothership = (
			motherRect.left < x && motherRect.left + motherRect.width > x + width &&
			motherRect.top < y && motherRect.top + motherRect.height > y + height
		);
		if (
			containedByMothership &&
			objects.every((otherObject) => {
				if (otherObject === o) {
					return true;
				}
				const otherRect = otherObject.$window.element.getBoundingClientRect();
				const ourRect = $window.element.getBoundingClientRect();
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
				objects.sort((a, b) => Number(b.clipping) - Number(a.clipping));
				objects.forEach((object, index) => { object.z = index; });
			}
		} else if (!containedByMothership) {
			o.crossedDuringThisContainment = false;
		}
		if (pause_checkbox.checked) {
			o.x = $($window.element).offset().left;
			o.y = $($window.element).offset().top;
		} else {
			$($window.element).css({
				left: x,
				top: y,
				// width: width,
				// height: height,
			});
		}
		$($window.element).css({
			zIndex: o.z,
			clipPath: o.clipping ? `polygon(
				${motherRect.left - x}px ${motherRect.top - y}px,
				${motherRect.right - x}px ${motherRect.top - y}px,
				${motherRect.right - x}px ${motherRect.bottom - y}px,
				${motherRect.left - x}px ${motherRect.bottom - y}px
			)` : '',
			// "--ButtonFace": o.clipping ? "#f0a390" : "#f0f390",
		});
		o.lagged_x ??= o.x;
		o.lagged_y ??= o.y;
		o.prev_x ??= o.x;
		o.prev_y ??= o.y;
		if (o.x !== o.prev_x || o.y !== o.prev_y) {
			$window.$content.find("img").css({
				transform: `rotate(${Math.atan2(o.y - o.lagged_y, o.x - o.lagged_x) * 180 / Math.PI + 90}deg)`,
			});
			o.lagged_x += (o.x - o.lagged_x) * 0.1;
			o.lagged_y += (o.y - o.lagged_y) * 0.1;
		}
		o.prev_x = o.x;
		o.prev_y = o.y;
	}
};
animate();

// The clip-path only makes sense if the document is not scrolled.
addEventListener("scroll", () => scrollTo(0, 0));
