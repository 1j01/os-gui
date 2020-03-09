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
	for (var k in colors) {
		colors[k] = `rgb(${colors[k].split(" ").join(", ")})`;
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

	var cssVars = Object.assign({checker}, colors);
	var cssProperties = {};
	for (var k in cssVars) {
		cssProperties[`--${k}`] = cssVars[k];
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
