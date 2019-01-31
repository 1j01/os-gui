const gulp = require('gulp')
const watch = require('gulp-watch')
const plumber = require('gulp-plumber')

gulp.task('watch', () => {
	const postcss = require('gulp-postcss')
	const sourcemaps = require('gulp-sourcemaps')

	return gulp.src('src/**/*.css')
		.pipe( watch('src/**/*.css') )
		.pipe( plumber() )
		.pipe( sourcemaps.init() )
		.pipe( postcss([ require('precss'), require('autoprefixer') ]) )
		.pipe( sourcemaps.write('.') )
		.pipe( gulp.dest('build/') )
})
