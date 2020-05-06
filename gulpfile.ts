const { task, src, dest, watch, series, parallel } = require('gulp');

const newer = require('gulp-newer');
const imagemin = require('gulp-imagemin');
const htmlclean = require('gulp-htmlclean');
const concat = require('gulp-concat');
const deporder = require('gulp-deporder');
const stripdebug = require('gulp-strip-debug');
const uglify = require('gulp-uglify');
const connect = require('gulp-connect');

const postcss = require('gulp-postcss');
const cssAssets = require('postcss-assets');
const autoprefixer = require('autoprefixer');
const cssMQPacker = require('css-mqpacker');
const cssNano = require('cssnano');
const cssPresetEnv = require('postcss-preset-env');
const cssImport = require('postcss-import');
const cssNested = require('postcss-nested');
const cssCalc = require('postcss-calc');
const cssCustomMedia = require('postcss-custom-media');
const discardComments = require('postcss-discard-comments');

const dev = process.env.NODE_ENV !== 'production';
const folder = { src: 'src/', dist: 'dist/' };

task('image', () => {
	const out = folder.dist + 'assets/';

	return src(folder.src + 'assets/**/*')
		.pipe(newer(out))
		.pipe(imagemin({ optimizationLevel: 5 }))
		.pipe(dest(out))
		.pipe(connect.reload());
});

task(
	'html',
	series(parallel('image'), () => {
		const out = folder.dist;

		let page = src(folder.src + '*.html').pipe(newer(out));
		page = page.pipe(htmlclean());

		return page.pipe(dest(out)).pipe(connect.reload());
	})
);

task('js', () => {
	let jsbuild = src(folder.src + 'js/**/*')
		.pipe(deporder())
		.pipe(concat('index.js'));

	if (!dev) {
		jsbuild = jsbuild.pipe(stripdebug()).pipe(uglify());
	}

	return jsbuild.pipe(dest(folder.dist)).pipe(connect.reload());
});

task(
	'css',
	series(parallel('image'), () =>
		src(folder.src + 'styles/index.css')
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
			.pipe(dest(folder.dist))
			.pipe(connect.reload())
	)
);

task('connect', () => connect.server({ root: 'dist', livereload: true }));

task('watch', () => {
	watch([folder.src + 'assets/**/*'], 'image');
	watch([folder.src + '*.html'], 'html');
	watch([folder.src + 'js/**/*'], 'js');
	watch([folder.src + 'styles/**/*'], 'css');
});

task('build', parallel('html', 'css', 'js'));

task('default', series('build', 'connect', 'watch'));
