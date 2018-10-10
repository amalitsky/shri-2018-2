const gulp = require('gulp');
const less = require('gulp-less');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const lessFiles = 'src/styles/**/*.less';
const publish = require('gulp-gh-pages');

gulp.task('compile-css', function () {
    return gulp.src(lessFiles)
        .pipe(less())
        .pipe(concat('default.css'))
        .pipe(gulp.dest('public'))
        .pipe(browserSync.stream());
});

gulp.task('serve', ['compile-css'], function() {
    browserSync.init({
        server: 'public',
        open: false
    });

    gulp.watch(lessFiles, ['compile-css']);
    gulp.watch('public/index.html')
        .on('change', browserSync.reload);
});

gulp.task('default', ['serve']);

gulp.task(
    'publish',
    () => gulp.src("./public/**/*").pipe(publish())
);
