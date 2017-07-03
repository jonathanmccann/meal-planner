var bodyParser = require('body-parser');
var config = require('./config');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var flash = require('connect-flash');
var logger = require('morgan');
var passport = require('passport');
var path = require('path');
var session = require('express-session');
var stylus = require('stylus');

var assorted = require('./routes/assorted');
var authorize = require('./routes/authorize');
var calendar = require('./routes/calendar');
var category = require('./routes/category');
var recipe = require('./routes/recipe');
var user = require('./routes/user');

require('./config/passport')(passport);

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(flash());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.configuration.sessionSecret
}));

app.use(passport.initialize());
app.use(passport.session());

function isLoggedIn(req, res, next) {
    if (req.user) {
      next();
    }
    else {
      res.redirect('/log-in');
    }
}

app.get('/', function(req, res) {
  res.render('home', {
    title: "Meal Planner",
    user: req.user
  });
});

app.use('/', user);
app.use('/', isLoggedIn, assorted);
app.use('/', isLoggedIn, authorize);
app.use('/', isLoggedIn, calendar);
app.use('/', isLoggedIn, category);
app.use('/', isLoggedIn, recipe);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res) {
  res.locals.message = err.message;
  res.locals.error = err;

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
