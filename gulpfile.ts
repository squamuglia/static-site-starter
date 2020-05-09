// Gulp
const { task, src, dest, watch, series, parallel } = require('gulp');
const newer = require('gulp-newer');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
// HTML
const htmlclean = require('gulp-htmlclean');
// Assets
const imagemin = require('gulp-imagemin');
// JS
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const stripdebug = require('gulp-strip-debug');
const sourcemaps = require('gulp-sourcemaps');
const typescript = require('gulp-typescript');
const ts = typescript.createProject('tsconfig.json');
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

// Source and output folders
const input = 'src/';
const output = 'dist/';

task('assets', () =>
	src(input + 'assets/**/*')
		.pipe(newer(output + 'assets/'))
		.pipe(imagemin())
		.pipe(dest(output + 'assets/'))
		.pipe(browserSync.stream({ match: 'assets/**/*' }))
);

task(
	'html',
	series(parallel('assets'), () =>
		src(input + '*.html')
			.pipe(newer(output))
			.pipe(htmlclean())
			.pipe(dest(output))
			.pipe(browserSync.stream({ match: '*.html' }))
	)
);

task('js', () =>
	src(input + 'js/**/*')
		.pipe(sourcemaps.init())
		.pipe(ts())
		.pipe(babel({ presets: ['@babel/preset-env'] }))
		.pipe(uglify())
		.pipe(concat('index.js'))
		.pipe(sourcemaps.write('/maps'))
		.pipe(dest(output))
		.pipe(browserSync.stream({ match: 'js/**/*' }))
);

task(
	'css',
	series(parallel('assets'), () =>
		src(input + 'styles/index.css')
			.pipe(
				// Order is important here
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
			.pipe(dest(output))
			.pipe(browserSync.stream({ match: 'styles/**/*' }))
	)
);

task(
	'serve',
	series('css', (done) => {
		browserSync.init({ server: output });
		// Watch these things and rebuild them when they change
		watch([input + 'assets/**/*'], series('assets'));
		watch([input + 'styles/**/*'], series('css'));
		watch([input + 'js/**/*'], series('js'));
		watch([input + '*.html'], series('html'));
		// Refresh when these things change
		watch(input + 'styles/**/*').on('change', browserSync.reload);
		watch(input + 'js/**/*').on('change', browserSync.reload);
		watch(input + '*.html').on('change', browserSync.reload);

		done();
	})
);

// Public tasks
task('build', parallel('html', 'css', 'js', 'assets'), (done) => done());
task('default', series('build', 'serve'), (done) => done());
