function parseINIString(data){
	var regex = {
		section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
		param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
		comment: /^\s*;.*$/
	};
	var value = {};
	var lines = data.split(/[\r\n]+/);
	var section = null;
	lines.forEach(function(line){
		if(regex.comment.test(line)){
			return;
		}else if(regex.param.test(line)){
			var match = line.match(regex.param);
			if(section){
				value[section][match[1]] = match[2];
			}else{
				value[match[1]] = match[2];
			}
		}else if(regex.section.test(line)){
			var match = line.match(regex.section);
			value[match[1]] = {};
			section = match[1];
		}else if(line.length == 0 && section){
			section = null;
		};
	});
	return value;
}

function parseThemeFileString(themeIni) {
	var theme = parseINIString(themeIni);
	var colors = theme["Control Panel\\Colors"];
	if (!colors) {
		alert("Invalid theme file, no [Control Panel\\Colors] section");
		console.log(theme);
	}
	for (var k in colors) {
		// for .themepack file support, just ignore bad keys that were parsed
		if (k.match(/\W/)) {
			delete colors[k];
		} else {
			colors[k] = `rgb(${colors[k].split(" ").join(", ")})`;
		}
	}

	var canvas = document.createElement("canvas");
	canvas.width = canvas.height = 2;
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = colors.ButtonFace;
	ctx.fillRect(0, 1, 1, 1);
	ctx.fillRect(1, 0, 1, 1);
	ctx.fillStyle = colors.ButtonHilight;
	ctx.fillRect(0, 0, 1, 1);
	ctx.fillRect(1, 1, 1, 1);
	var checker = `url("${canvas.toDataURL()}")`;

	var arrow_canvas = document.createElement("canvas");
	var arrow_ctx = arrow_canvas.getContext("2d");
	var arrow_size = 4;
	var arrow_width = arrow_size * 2 - 1;
	arrow_canvas.width = arrow_width;
	arrow_canvas.height = arrow_size;
	arrow_ctx.fillStyle = "white";
	for (let y = 0; y < arrow_size; y += 1) {
		for (let x = y; x < arrow_width - y; x += 1) {
			arrow_ctx.fillRect(x, y, 1, 1);
		}
	}

	var scrollbar_size = 16;
	var scrollbar_button_inner_size = scrollbar_size - 4;
	canvas.width = scrollbar_button_inner_size * 4;
	canvas.height = scrollbar_button_inner_size;
	for (let i = 0; i < 4; i += 1) {
		ctx.save();
		ctx.translate(i * scrollbar_button_inner_size, 0);
		ctx.translate(scrollbar_button_inner_size/2, scrollbar_button_inner_size/2);
		ctx.rotate(i * Math.PI / 2);
		ctx.translate(-scrollbar_button_inner_size/2, -scrollbar_button_inner_size/2);
		ctx.drawImage(arrow_canvas, ~~(scrollbar_button_inner_size/2-arrow_width/2), ~~(scrollbar_button_inner_size/2-arrow_size/2)); // TODO: might not be the right centering
		ctx.restore();
	}

	ctx.save();
	ctx.globalCompositeOperation = "source-in";
	ctx.fillStyle = colors.ButtonText;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	var scrollbar_arrows_ButtonText = `url("${canvas.toDataURL()}")`;
	ctx.fillStyle = colors.GrayText;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	var scrollbar_arrows_GrayText = `url("${canvas.toDataURL()}")`;
	ctx.fillStyle = colors.ButtonHilight;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	var scrollbar_arrows_ButtonHilight = `url("${canvas.toDataURL()}")`;
	// ctx.fillStyle = "red";
	// ctx.fillRect(0, 0, canvas.width, canvas.height);
	// canvas.style.background = "rgba(0, 0, 0, 0.2)";
	// $("h1").append(arrow_canvas).append(canvas);
	ctx.restore();

	var cssProperties = {
		"--checker": checker,
		"--scrollbar-arrows-ButtonText": scrollbar_arrows_ButtonText,
		"--scrollbar-arrows-GrayText": scrollbar_arrows_GrayText,
		"--scrollbar-arrows-ButtonHilight": scrollbar_arrows_ButtonHilight,
		"--scrollbar-size": `${scrollbar_size}px`,
		"--scrollbar-button-inner-size": `${scrollbar_button_inner_size}px`,
	};
	for (var k in colors) {
		cssProperties[`--${k}`] = colors[k];
	}

	return cssProperties;
}

function applyCSSProperties(cssProperties) {
	for (var k in cssProperties) {
		document.documentElement.style.setProperty(k, cssProperties[k]);
	}
}

function makeThemeCSSFile(cssProperties) {
	var css = `
/* This is a generated file. */
:root {
`;
	for (var k in cssProperties) {
		css += `\t${k}: ${cssProperties[k]};\n`;
	}
	css += `}
`;
	return css;
}
