const gulp = require('gulp')
const plumber = require('gulp-plumber')

const cssSourcesGlob = 'src/**/*.css';
gulp.task('css', () => {
	const postcss = require('gulp-postcss')
	const sourcemaps = require('gulp-sourcemaps')

	return gulp.src('src/**/*.css')
		.pipe( plumber() )
		.pipe( sourcemaps.init() )
		.pipe( postcss([ require('precss'), require('autoprefixer') ]) )
		.pipe( sourcemaps.write('.') )
		.pipe( gulp.dest('build/') )
})
function waitForChanges() {
	return gulp.watch(cssSourcesGlob, gulp.task('css'))
}
gulp.task('watch', gulp.series(['css', waitForChanges]))
