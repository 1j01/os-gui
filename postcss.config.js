module.exports = ctx => ({
	map: ctx.options.map,
	parser: ctx.options.parser,
	plugins: {
		precss: true,
		autoprefixer: true,
		"postcss-url": { url: "inline" },
		// cssnano: ctx.env === "production" ? {} : false
	}
})
