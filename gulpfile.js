const gulp = require('gulp')
const watch = require('gulp-watch')

gulp.task('watch', () => {
	const postcss = require('gulp-postcss')
	const sourcemaps = require('gulp-sourcemaps')

	return watch('src/**/*.css', { ignoreInitial: false })
		.pipe( sourcemaps.init() )
		.pipe( postcss([ require('precss'), require('autoprefixer') ]) )
		.pipe( sourcemaps.write('.') )
		.pipe( gulp.dest('build/') )
})
