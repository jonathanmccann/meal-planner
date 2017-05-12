var bodyParser = require('body-parser');
var config = require('./config');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var flash = require('connect-flash');
var logger = require('morgan');
var path = require('path');
var session = require('express-session');
var stylus = require('stylus');

var assorted = require('./routes/assorted');
var calendar = require('./routes/calendar');
var category = require('./routes/category');
var recipe = require('./routes/recipe');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  cookie: {
    maxAge: 60000
  },
  resave: true,
  saveUninitialized: true,
  secret: config.configuration.sessionSecret
}));
app.use(flash());

app.use('/', assorted);
app.use('/', calendar);
app.use('/', category);
app.use('/', recipe);

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
