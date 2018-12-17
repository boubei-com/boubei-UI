var gulp = require('gulp')
var babel = require('gulp-babel')
var uglify = require('gulp-uglify')
var rename = require('gulp-rename')
var sass = require('gulp-sass')
var cleanCSS = require('gulp-clean-css')

gulp.task('sass', function () {
  gulp.src('./src/*/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(cleanCSS())
      .pipe(rename(function (path) {
        path.dirname = 'css'
      }))
      .pipe(gulp.dest('./dist'))
})

gulp.task('script', function () {
  gulp.src('./src/*/*.js')
      .pipe(babel())
      .pipe(uglify())
      .pipe(rename(function (path) {
        path.dirname = 'js'
        path.basename += '.min'
      }))
      .pipe(gulp.dest('./dist'))
})

gulp.task('autosass', function () {
  gulp.watch('./src/*/*.scss', ['sass'])
})

gulp.task('autojs', function () {
  gulp.watch('./src/*/*.js', ['script'])
})

gulp.task('default', ['sass', 'script', 'autosass', 'autojs'])