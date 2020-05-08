// Gulp
const { task, src, dest, watch, series, parallel } = require('gulp');
const newer = require('gulp-newer');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();

// HTML
const htmlclean = require('gulp-htmlclean');

// Image
const imagemin = require('gulp-imagemin');

// JS
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const stripdebug = require('gulp-strip-debug');
const sourcemaps = require('gulp-sourcemaps');

// CSS
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssAssets = require('postcss-assets');
const cssMQPacker = require('css-mqpacker');
const cssNano = require('cssnano');
const cssPresetEnv = require('postcss-preset-env');
const cssImport = require('postcss-import');
const cssNested = require('postcss-nested');
const cssCalc = require('postcss-calc');
const cssCustomMedia = require('postcss-custom-media');
const discardComments = require('postcss-discard-comments');

const dev = process.env.NODE_ENV !== 'production';
const source = 'src/',
	dist = 'dist/';

task('assets', () => {
	const out = dist + 'assets/';

	return src(source + 'assets/**/*')
		.pipe(newer(out))
		.pipe(imagemin({ optimizationLevel: 5 }))
		.pipe(dest(out))
		.pipe(browserSync.stream({ match: 'assets/**/*' }));
});

task(
	'html',
	series(parallel('assets'), () =>
		src(source + '*.html')
			.pipe(newer(dist))
			.pipe(htmlclean())
			.pipe(dest(dist))
			.pipe(browserSync.stream({ match: '*.html' }))
	)
);

task('js', () =>
	src(source + 'js/**/*')
		.pipe(sourcemaps.init())
		.pipe(babel({ presets: ['@babel/preset-env'] }))
		.pipe(uglify())
		.pipe(concat('index.js'))
		.pipe(sourcemaps.write('/maps'))
		.pipe(dest(dist))
		.pipe(browserSync.stream({ match: 'js/**/*' }))
);

task(
	'css',
	series(parallel('assets'), () =>
		src(source + 'styles/index.css')
			.pipe(
				postcss([
					cssImport,
					cssNested,
					cssCustomMedia,
					autoprefixer,
					cssPresetEnv({
						stage: 0,
						features: {
							'nesting-rules': true,
						},
					}),
					cssCalc,
					cssAssets({ loadPaths: ['assets/'] }),
					cssMQPacker,
					cssNano,
				])
			)
			.pipe(dest(dist))
			.pipe(browserSync.stream({ match: 'styles/**/*' }))
	)
);

task(
	'serve',
	series('css', (done) => {
		browserSync.init({ server: dist });

		watch([source + 'assets/**/*'], series('assets'));
		watch([source + 'styles/**/*'], series('css'));
		watch([source + 'js/**/*'], series('js'));
		watch([source + '*.html'], series('html'));

		watch(source + 'styles/**/*').on('change', browserSync.reload);
		watch(source + 'js/**/*').on('change', browserSync.reload);
		watch(source + '*.html').on('change', browserSync.reload);

		done();
	})
);

task('build', parallel('html', 'css', 'js', 'assets'), (done) => done());

task('default', series('build', 'serve'), (done) => done());
