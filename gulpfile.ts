// Gulp
import { task, src, dest, watch, series, parallel } from "gulp";
import newer from "gulp-newer";
import concat from "gulp-concat";
import { create } from "browser-sync";
// HTML
import htmlclean = require("gulp-htmlclean");
// Assets
import imagemin = require("gulp-imagemin");
// JS
import babel from "gulp-babel";
import uglify from "gulp-uglify";
import sourcemaps from "gulp-sourcemaps";
import { createProject } from "gulp-typescript";
// CSS
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import cssAssets from "postcss-assets";
import cssMQPacker from "css-mqpacker";
import cssNano from "cssnano";
import cssPresetEnv from "postcss-preset-env";
import cssImport from "postcss-import";
import cssNested from "postcss-nested";
import cssCalc from "postcss-calc";
import cssCustomMedia from "postcss-custom-media";
import discardComments from "postcss-discard-comments";

const browserSync = create();
const typescript = createProject("tsconfig.json");

// Source and output folders
const input = "src/";
const output = "dist/";

task("assets", () =>
  src(input + "assets/**/*")
    .pipe(newer(output + "assets/"))
    .pipe(imagemin())
    .pipe(dest(output + "assets/"))
    .pipe(browserSync.stream({ match: "assets/**/*" }))
);

task(
  "html",
  series(parallel("assets"), () =>
    src(input + "pages/**/*")
      .pipe(newer(output))
      .pipe(htmlclean())
      .pipe(dest(output))
      .pipe(browserSync.stream({ match: "*.html" }))
  )
);

task("js", () =>
  src(input + "js/**/*")
    .pipe(sourcemaps.init())
    .pipe(typescript())
    .pipe(babel({ presets: ["@babel/preset-env", "@babel/preset-typescript"] }))
    .pipe(uglify())
    .pipe(concat("index.js"))
    .pipe(sourcemaps.write("/maps"))
    .pipe(dest(output))
    .pipe(browserSync.stream({ match: "js/**/*" }))
);

task(
  "css",
  series(parallel("assets"), () =>
    src(input + "styles/index.css")
      .pipe(
        /**
         * Order is important for PostCSS plugins.
         * If you don't like PostCSS, delete these
         * plugins and add your own :)
         */
        postcss([
          cssImport,
          cssNested,
          cssCustomMedia,
          autoprefixer,
          cssPresetEnv({
            stage: 0,
            features: {
              "nesting-rules": true,
            },
          }),
          cssCalc,
          discardComments,
          cssAssets({ loadPaths: ["assets/"] }),
          cssMQPacker,
          cssNano,
        ])
      )
      .pipe(dest(output))
      .pipe(browserSync.stream({ match: "styles/**/*" }))
  )
);

task(
  "serve",
  series("css", (done) => {
    browserSync.init({ server: output });
    // Watch these things and rebuild them when they change
    watch([input + "assets/**/*"], series("assets"));
    watch([input + "styles/**/*"], series("css"));
    watch([input + "js/**/*"], series("js"));
    watch([input + "pages/**/*"], series("html"));
    // Refresh when these things change
    watch(output + "*.css").on("change", browserSync.reload);
    watch(output + "*.js").on("change", browserSync.reload);
    watch(output + "*.html").on("change", browserSync.reload);

    done();
  })
);

// Public tasks
task("build", parallel("html", "css", "js", "assets"), (done) => done());
task("default", series("build", "serve"), (done) => done());
