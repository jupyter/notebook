var fork = require('child_process').fork;
var fs = require('fs');
var path = require('path');

var through = require('through');
var gulp = require('gulp');
var less = require('gulp-less');
var newer = require('gulp-newer');
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
    // we don't minify on purpose as it removes rules
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
var apps = ['notebook', 'tree', 'edit', 'terminal', 'auth'];

apps.map(function (name) {
  gulp.task(name + '-js', function (finish) {
    var s = path.join('notebook', 'static');
    var src = path.join(s, name, 'js', 'main.js');
    var rel_dest = path.join(name, 'js', 'main.min.js');
    var dest = path.join(s, rel_dest);
    
    var sources = [
      path.join(s, name, 'js', '*.js'),
      path.join(s, "base", 'js', '*.js'),
      path.join(s, "auth", 'js', '*.js'),
      path.join(s, "services", 'config.js'),
    ];
    
    // for required_components
    if (name === 'notebook') {
      sources.push(path.join(s, "services", '**', '*.js'));
    }
    
    fs.readdirSync(path.join(s, 'components')).map(function (c) {
      if (c !== 'MathJax') {
        // skip MathJax because it has tons of files and makes everything super slow
        sources.push(path.join(s, 'components', c, '**', '*.js'));
      }
    });
    
    // sources is a greedy list, containing all dependencies plus some for simplicity.
    gulp.src(sources, {base: s})
    .pipe(newer(dest))
    .pipe(through(function(file) {
      // if any dependency changed, update main.min.js
      console.log("A dependency has changed, updating " + rel_dest);
      // pause halts the pipeline
      this.pause();
      build_main(name, finish);
      return;
    }))
    .on('end', function () {
      // if we get here, no dependency is newer than the target
      console.log(rel_dest + " up to date");
      finish();
    });
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
