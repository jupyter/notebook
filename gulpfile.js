var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');
var minifyCSS = require('gulp-minify-css');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');

// now some dev nice utilities.
var livereload = require('gulp-livereload');
 
gulp.task('css', function () {
  return gulp.src('./notebook/static/style/*.less')
    .pipe(sourcemaps.init())
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(minifyCSS({restructuring: false}))
    .pipe(rename({
            suffix: '.min'
        }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./notebook/static/style'))
    .pipe(livereload());
});



gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('notebook/static/**/*.less', ['css']);
});
