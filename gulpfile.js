var fork = require('child_process').fork;
var path = require('path');

var gulp = require('gulp');
var less = require('gulp-less');
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

function build_main(name, callback) {
  // build main.min.js for a given application name
  // run in a subprocess to allow parallel builds
  // clone requirejs config
  var p = fork('./build-main.js', [name]);
  p.on('exit', function (code, status) {
    if (code) {
      callback(new Error("Build failed"));
    } else {
      callback();
    }
  });
  return;
}

// build notebook-js, edit-js, etc. tasks
// which enables parallelism
var apps = ['edit', 'notebook', 'terminal', 'tree'];

apps.map(function (name) {
  gulp.task(name + '-js', function (finish) {
    build_main(name, finish);
  });
});

gulp.task('js', apps.map(function (name) { return name + '-js'; }));

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('notebook/static/**/*.less', ['css']);
  
  var s = path.join('notebook', 'static');
  
  function alljs(name) {
    return path.join(s, name, '**', '*.js');
  }
  var common_js = ['components', 'base', 'auth', 'services'].map(alljs);
  
  gulp.watch(common_js, ['js']);
  apps.map(function (name) {
    gulp.watch([
      alljs(name),
      '!' + path.join(s, name, 'js', 'main.min.js'),
    ], [name + '-js']);
  });
});
