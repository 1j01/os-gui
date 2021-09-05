const $windows = [];
const n_$windows = 10;
const $mothership = new $Window({
	title: 'Mothership',
	outerWidth: 400,
	outerHeight: 300,
});

for (let i = 0; i < n_$windows; ++i) {
	const $window = new $Window({
		title: "Window " + i,
	});
	$windows.push($window);
}
const animate = () => {
	requestAnimationFrame(animate);
	const motherRect = $mothership.$content[0].getBoundingClientRect();
	for (let i = 0; i < $windows.length; i++) {
		const $window = $windows[i];
		let x = Math.sin(Date.now() / 1000 + i / n_$windows * Math.PI * 2) * 300;
		let y = 0;//Math.cos(Date.now() / 1000 + i / n_$windows * Math.PI * 2) * 100;
		let width = Math.cos(Date.now() / 1000 + i / n_$windows * Math.PI * 2) * 50 + 100;
		let height = width;
		x += (window.innerWidth - width) / 2;
		y += (window.innerHeight - height) / 2;
		// x += motherRect.width / 2;
		// x += motherRect.left + motherRect.width / 2;
		// y += motherRect.top + motherRect.height / 2;
		x = ~~x;
		y = ~~y;
		width = ~~width;
		height = ~~height;
		// const shouldClip = Math.cos(Date.now() / 1000 + i / n_$windows * Math.PI * 2 + Math.PI / 2) > 0;
		const shouldClip = x - (motherRect.left + motherRect.width / 2) < 0;
		$window.css({
			left: x,
			top: y,
			width: width,
			height: height,
			zIndex: ~~((Math.cos(Date.now() / 1000 + i / n_$windows * Math.PI * 2)) * 100),
			clipPath: shouldClip ? `polygon(
				${motherRect.left - x}px ${motherRect.top - y}px,
				${motherRect.right - x}px ${motherRect.top - y}px,
				${motherRect.right - x}px ${motherRect.bottom - y}px,
				${motherRect.left - x}px ${motherRect.bottom - y}px
			)` : '',
			// clip: `rect(${motherRect.top - x}px, ${motherRect.right - x}px, ${motherRect.bottom - y}px, ${motherRect.left - y}px)`,
		});
	}
};
animate();
