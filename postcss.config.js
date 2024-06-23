/**
 * @typedef {('development'|'production'|string)} PostCSSEnv
 */

/**
 * @typedef {Object} PostCSSFile
 * @property {string} dirname
 * @property {string} basename
 * @property {string} extname
 */

/**
 * @typedef {Object} PostCSSOptions
 * @property {unknown} [map]
 * @property {unknown} [parser]
 * @property {unknown} [syntax]
 * @property {unknown} [stringifier]
 */

/**
 * @typedef {Object} PostCSSContext
 * @property {PostCSSEnv} env
 * @property {PostCSSFile} file
 * @property {PostCSSOptions} options
 */

/**
 * @typedef {Object} PostCSSConfig
 * @property {unknown} [map]
 * @property {unknown} [parser]
 * @property {Record<string, unknown>} plugins
 */

/**
 * @param {PostCSSContext} ctx
 * @returns {PostCSSConfig} PostCSS configuration for a given file
 */
module.exports = (ctx) => ({
	map: ctx.options.map,
	parser: ctx.options.parser,
	plugins: {
		precss: true,
		autoprefixer: true,
		"postcss-url": { url: "inline" },
		// cssnano: ctx.env === "production" ? {} : false
	}
})
