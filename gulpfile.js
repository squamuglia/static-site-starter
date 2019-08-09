const gulp = require("gulp"),
  newer = require("gulp-newer"),
  imagemin = require("gulp-imagemin"),
  htmlclean = require("gulp-htmlclean"),
  concat = require("gulp-concat"),
  deporder = require("gulp-deporder"),
  stripdebug = require("gulp-strip-debug"),
  uglify = require("gulp-uglify"),
  postcss = require("gulp-postcss"),
  assets = require("postcss-assets"),
  autoprefixer = require("autoprefixer"),
  mqpacker = require("css-mqpacker"),
  cssnano = require("cssnano"),
  connect = require("gulp-connect"),
  presetEnv = require("postcss-preset-env"),
  atImport = require("postcss-import"),
  devBuild = process.env.NODE_ENV !== "production",
  folder = {
    src: "src/",
    build: "build/"
  };

gulp.task("images", function() {
  const out = folder.build + "images/";
  return gulp
    .src(folder.src + "images/**/*")
    .pipe(newer(out))
    .pipe(imagemin({ optimizationLevel: 5 }))
    .pipe(gulp.dest(out))
    .pipe(connect.reload());
});

gulp.task("html", ["images"], function() {
  var out = folder.build,
    page = gulp.src(folder.src + "*.html").pipe(newer(out));

  // minify production code
  // if (!devBuild) {
  page = page.pipe(htmlclean());
  // }

  return page.pipe(gulp.dest(out)).pipe(connect.reload());
});

gulp.task("js", function() {
  var jsbuild = gulp
    .src(folder.src + "js/**/*")
    .pipe(deporder())
    .pipe(concat("index.js"));

  if (!devBuild) {
    jsbuild = jsbuild.pipe(stripdebug()).pipe(uglify());
  }

  return jsbuild.pipe(gulp.dest(folder.build + "js/")).pipe(connect.reload());
});

gulp.task("css", ["images"], function() {
  var postCssOpts = [
    atImport(),
    assets({ loadPaths: ["images/"] }),
    autoprefixer(),
    presetEnv({
      stage: 0,
      features: {
        "nesting-rules": true
      }
    }),
    mqpacker
  ];

  // if (!devBuild) {
  postCssOpts.push(cssnano);
  // }

  return gulp
    .src(folder.src + "css/index.css")
    .pipe(postcss(postCssOpts))
    .pipe(gulp.dest(folder.build + "css/"))
    .pipe(connect.reload());
});

gulp.task("fonts", function() {
  gulp.src(folder.src + "fonts/**/*").pipe(gulp.dest(folder.build + "fonts/"));
});

gulp.task("connect", function() {
  connect.server({ root: "build", livereload: true });
});

gulp.task("run", ["html", "css", "js", "fonts"]);

gulp.task("watch", function() {
  gulp.watch(folder.src + "images/**/*", ["images"]);
  gulp.watch(folder.src + "*.html", ["html"]);
  gulp.watch(folder.src + "js/**/*", ["js"]);
  gulp.watch(folder.src + "css/**/*", ["css"]);
});

gulp.task("default", ["run", "connect", "watch"]);
