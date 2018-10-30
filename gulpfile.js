const gulp = require('gulp');
const less = require('gulp-less');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const lessFiles = 'src/styles/**/*.less';
const publish = require('gulp-gh-pages');
const ts = require('gulp-typescript');

const tsProject = ts.createProject('tsconfig.json');

gulp.task('compile-css', function () {
    return gulp.src(lessFiles)
        .pipe(less())
        .pipe(concat('default.css'))
        .pipe(gulp.dest('public'))
        .pipe(browserSync.stream());
});

gulp.task('compile-ts', function () {
  return tsProject.src()
  .pipe(tsProject())
  .js.pipe(gulp.dest('public'));
});

gulp.task('build', ['compile-css', 'compile-ts']);

gulp.task('serve', ['build'], function() {
    browserSync.init({
        server: 'public',
        open: false
    });

    gulp.watch('src/*.ts', ['compile-ts'])
        .on('change', browserSync.reload);

    gulp.watch(lessFiles, ['compile-css']);
    gulp.watch('public/index.html')
        .on('change', browserSync.reload);
});

gulp.task('default', ['serve']);

gulp.task('publish', () => gulp.src("./public/**/*").pipe(publish()));
