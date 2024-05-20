const svgMaybe = document.getElementById("physics-teaser");
if (!svgMaybe) {
	throw new Error("Couldn't find the SVG element");
}
const svgLinkMaybe = svgMaybe.closest("a");
if (!svgLinkMaybe) {
	throw new Error("Couldn't find the parent link anchor element");
}

// Typescript doesn't narrow the type to non-null inside functions below.
// To be fair, named functions can be used above the const declarations,
// but it doesn't use the fact that there are no calls before the const declarations.
const svg = svgMaybe;
const svgLink = svgLinkMaybe;

/**
 * @param {string} tag 
 * @param {Record<string, string | number>} attrs 
 * @returns {SVGElement}
 */
function createElementSVG(tag, attrs) {
	const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
	for (let k in attrs) {
		el.setAttribute(k, attrs[k].toString());
	}
	return el;
}

/**
 * @typedef {{
 * 	x: number,
 * 	y: number,
 * 	vx: number,
 * 	vy: number,
 * 	fx: number,
 * 	fy: number,
 * 	color: string,
 * 	circle: SVGElement,
 * }} PhysicsPoint
 * 
 * @typedef {{
 * 	point1: PhysicsPoint,
 * 	point2: PhysicsPoint,
 * 	targetDistance: number,
 * 	line1: SVGElement,
 * 	line2: SVGElement,
 * }} PhysicsConnection
 */

/** @type {PhysicsPoint[]} */
let points = [];
/** @type {PhysicsConnection[]} */
let connections = [];

const pointRadius = 3;
const border = pointRadius;
let clipPathRadius = 50;
let inViewport = false;
let animating = false;

const friction = 0.2;
const coefficientOfRestitution = 0.8;

/**
 * @param {Partial<PhysicsPoint>} options 
 * @returns {PhysicsPoint}
 */
function addPoint(options) {
	/** @type {PhysicsPoint} */
	// @ts-ignore (Doesn't have `circle` yet; could restructure, but since `circle` has a circular dependency, it might be uglier)
	const point = Object.assign({
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		fx: 0,
		fy: 0,
		color: `hsl(${Math.random() * 360}, 100%, 50%)`,
	}, options);
	const el = createElementSVG("circle", {
		cx: point.x,
		cy: point.y,
		r: pointRadius,
		fill: point.color,
	});
	point.circle = el;
	svg.appendChild(el);
	points.push(point);
	return point;
}

/**
 * @param {PhysicsPoint} point1 
 * @param {PhysicsPoint} point2 
 * @param {number} [targetDistance]
 * @returns {PhysicsConnection}
 */
function addConnection(point1, point2, targetDistance = 10) {
	const connection = {
		point1,
		point2,
		targetDistance,
		line1: createElementSVG("line", { stroke: point1.color }),
		line2: createElementSVG("line", { stroke: point2.color }),
	};
	svg.appendChild(connection.line1);
	svg.appendChild(connection.line2);
	connections.push(connection);
	return connection;
}

/**
 * @param {{
 * 	x?: number,
 * 	y?: number,
 * 	vx?: number,
 * 	vy?: number,
 * 	numPoints?: number,
 * 	targetDistance?: number,
 * 	startRadius?: number,
 * 	rotationSpeed?: number,
 * 	pointOptions?: Partial<PhysicsPoint>,
 * }} options
 * @returns {{ ballPoints: PhysicsPoint[], ballConnections: PhysicsConnection[] }}
 */
function addBall({ x = 0, y = 0, vx = 0, vy = 0, numPoints = 10, targetDistance = 50, startRadius = 50, rotationSpeed = 0, pointOptions } = {}) {
	let ballPoints = [];
	let ballConnections = [];
	for (let i = 0; i < numPoints; i++) {
		const angle = i / numPoints * Math.PI * 2;
		const point = addPoint({
			x: x + Math.cos(angle) * startRadius,
			y: y + Math.sin(angle) * startRadius,
			vx: Math.cos(angle + Math.PI / 2) * rotationSpeed + vx,
			vy: Math.sin(angle + Math.PI / 2) * rotationSpeed + vy,
			...pointOptions,
		});
		ballPoints.push(point);
	}
	for (const point1 of ballPoints) {
		for (const point2 of ballPoints) {
			const connection = addConnection(point1, point2, targetDistance);
			ballConnections.push(connection);
		}
	}
	return { ballPoints, ballConnections };
}

addBall({ x: 100, y: 100, numPoints: 10, rotationSpeed: 5, vx: -5, vy: 2 });

/**
 * @param {number} a 
 * @param {number} b 
 * @param {number} t 
 * @returns {number}
 */
function lerp(a, b, t) {
	return a + (b - a) * t;
}
/**
 * @param {{x: number, y: number}[]} points 
 * @returns {{x: number, y: number}}
 */
function averagePoints(points) {
	let averageX = 0;
	let averageY = 0;
	for (const point of points) {
		averageX += point.x;
		averageY += point.y;
	}
	averageX /= points.length;
	averageY /= points.length;
	return { x: averageX, y: averageY };
}
function animatePhysicsTeaser() {
	for (const point of points) {
		point.vx += point.fx;
		point.vy += point.fy;
		point.x += point.vx;
		point.y += point.vy;
		point.circle.setAttribute("cx", `${point.x}`);
		point.circle.setAttribute("cy", `${point.y}`);
		if (point.x < border) {
			point.x = border;
			point.vx *= -coefficientOfRestitution;
			point.vy /= 1 + friction;
		}
		if (point.x > svg.clientWidth - border) {
			point.x = svg.clientWidth - border;
			point.vx *= -coefficientOfRestitution;
			point.vy /= 1 + friction;
		}
		if (point.y < border) {
			point.y = border;
			point.vy *= -coefficientOfRestitution;
			point.vx /= 1 + friction;
		}
		if (point.y > svg.clientHeight - border) {
			point.y = svg.clientHeight - border;
			point.vy *= -coefficientOfRestitution;
			point.vx /= 1 + friction;
		}
		point.fx = 0;
		point.fy = 0;
	}
	for (const connection of connections) {
		const { point1, point2, line1, line2, targetDistance } = connection;
		line1.setAttribute("x1", `${lerp(point1.x, point2.x, 0.2)}`);
		line1.setAttribute("y1", `${lerp(point1.y, point2.y, 0.2)}`);
		line1.setAttribute("x2", `${lerp(point1.x, point2.x, 0.4)}`);
		line1.setAttribute("y2", `${lerp(point1.y, point2.y, 0.4)}`);
		line2.setAttribute("x1", `${lerp(point1.x, point2.x, 0.6)}`);
		line2.setAttribute("y1", `${lerp(point1.y, point2.y, 0.6)}`);
		line2.setAttribute("x2", `${lerp(point1.x, point2.x, 0.8)}`);
		line2.setAttribute("y2", `${lerp(point1.y, point2.y, 0.8)}`);
		const distanceBetweenPointsReckoned = Math.hypot((point1.x + point1.vx) - (point2.x + point2.vx), (point1.y + point1.vy) - (point2.y + point2.vy));
		const distanceDiff = distanceBetweenPointsReckoned - targetDistance;
		const force = distanceDiff * 0.01 / (distanceBetweenPointsReckoned + 1);
		const dx = point2.x - point1.x;// + point2.vx - point1.vx;
		const dy = point2.y - point1.y;// + point2.vy - point1.vy;
		point1.fx += force * dx;
		point1.fy += force * dy;
		point2.fx -= force * dx;
		point2.fy -= force * dy;
	}

	// using parent <a> element for iOS Safari, where clip-path on the SVG gives different results
	const center = averagePoints(points);
	svgLink.style.clipPath = `circle(${clipPathRadius}px at ${center.x}px ${center.y}px)`;

	if (inViewport) {
		requestAnimationFrame(animatePhysicsTeaser);
	} else {
		animating = false;
	}
}

function possiblyAnimate() {
	const rect = svg.getBoundingClientRect();
	inViewport = rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
	if (inViewport && !animating) {
		animating = true;
		animatePhysicsTeaser();
	}
}
window.addEventListener('scroll', possiblyAnimate);
window.addEventListener('resize', possiblyAnimate);
setTimeout(possiblyAnimate, 100);

svg.onpointerdown = () => {
	// expand and contract
	for (const connection of connections) {
		connection.targetDistance *= 2;
		clipPathRadius = 100;
		if (connection.targetDistance > 100) {
			connection.targetDistance = 50;
			clipPathRadius = 50;
		}
	}
};
/** @param {Event} event */
svg.onselectstart = (event) => {
	event.preventDefault();
};

// iOS Safari ignores clip-path as far as interaction goes,
// so we need to manually ignore interaction outside the clip-path.
/** @param {MouseEvent} event */
svgLink.onclick =
svgLink.onauxclick =
svgLink.onpointerdown =
svgLink.onpointerup =
svgLink.oncontextmenu = (event) => {
	if (!insideClipPath(event)) {
		event.preventDefault();
		svgLink.style.pointerEvents = "none";
		setTimeout(() => {
			svgLink.style.pointerEvents = "auto";
		}, 100);
		return;
	}
};
/** @param {MouseEvent} event */
function insideClipPath(event) {
	const center = averagePoints(points);
	const rect = svg.getBoundingClientRect();
	const mouseX = event.clientX - rect.left;
	const mouseY = event.clientY - rect.top;
	return Math.hypot(mouseX - center.x, mouseY - center.y) < clipPathRadius;
}
