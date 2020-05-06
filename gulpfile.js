const { task, src, dest, watch, series } = require('gulp');
const newer = require('gulp-newer');
const imagemin = require('gulp-imagemin');
const htmlclean = require('gulp-htmlclean');
const concat = require('gulp-concat');
const deporder = require('gulp-deporder');
const stripdebug = require('gulp-strip-debug');
const uglify = require('gulp-uglify');
const postcss = require('gulp-postcss');
const assets = require('postcss-assets');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const cssnano = require('cssnano');
const connect = require('gulp-connect');
const presetEnv = require('postcss-preset-env');
const atImport = require('postcss-import');

const dev = process.env.NODE_ENV !== 'production';
const folder = { src: 'src/', dist: 'dist/' };

task('image', function () {
	const out = folder.dist + 'images/';

	return src(folder.src + 'images/**/*')
		.pipe(newer(out))
		.pipe(imagemin({ optimizationLevel: 5 }))
		.pipe(dest(out))
		.pipe(connect.reload());
});

task('html', series('image'), () => {
	const out = folder.dist;

	let page = src(folder.src + '*.html').pipe(newer(out));
	page = page.pipe(htmlclean());

	return page.pipe(dest(out)).pipe(connect.reload());
});

task('js', () => {
	let jsbuild = src(folder.src + 'js/**/*')
		.pipe(deporder())
		.pipe(concat('index.js'));

	if (!dev) {
		jsbuild = jsbuild.pipe(stripdebug()).pipe(uglify());
	}

	return jsbuild.pipe(dest(folder.dist + 'js/')).pipe(connect.reload());
});

task('css', series('image'), () =>
	src(folder.src + 'css/index.css')
		.pipe(
			postcss([
				atImport(),
				assets({ loadPaths: ['images/'] }),
				autoprefixer(),
				presetEnv({
					stage: 0,
					features: {
						'nesting-rules': true,
					},
				}),
				mqpacker,
				cssnano,
			])
		)
		.pipe(dest(folder.dist + 'css/'))
		.pipe(connect.reload())
);

task('fonts', () =>
	src(folder.src + 'fonts/**/*').pipe(dest(folder.dist + 'fonts/'))
);

task('connect', () => connect.server({ root: 'build', livereload: true }));

task('watch', () => {
	watch([folder.src + 'images/**/*'], 'image');
	watch([folder.src + '*.html'], 'html');
	watch([folder.src + 'js/**/*'], 'js');
	watch([folder.src + 'css/**/*'], 'css');
});

task('build', series('html', 'css', 'js', 'fonts'));

task('default', series('build', 'connect', 'watch'));
