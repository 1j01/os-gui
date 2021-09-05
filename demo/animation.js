const $windows = [];
const n_$windows = 10;

for (let i = 0; i < n_$windows; ++i) {
	const $window = new $Window({
		title: "Window " + i,
	});
	$windows.push($window);
}
const animate = () => {
	requestAnimationFrame(animate);
	const centerX = window.innerWidth / 2;
	const centerY = window.innerHeight / 2;
	for (let i = 0; i < $windows.length; i++) {
		const $window = $windows[i];
		$window.css({
			left: ~~(Math.sin(Date.now() / 1000 + i) * 100 + centerX),
			top: ~~(Math.cos(Date.now() / 1000 + i) * 100 + centerY),
			width: ~~(Math.sin(Date.now() / 1000 + i) * 100 + 100),
			height: ~~(Math.cos(Date.now() / 1000 + i) * 100 + 100),
		});
	}
};
animate();
