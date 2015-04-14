var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');
var minifyCSS = require('gulp-minify-css');
var rename = require('gulp-rename');
 
gulp.task('less', function () {
  return gulp.src('./jupyter_notebook/static/style/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(minifyCSS())
    .pipe(rename({
            suffix: '.min'
        }))
    .pipe(gulp.dest('./jupyter_notebook/static/style'));
});
