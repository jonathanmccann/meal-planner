var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var flash = require('connect-flash');
var logger = require('./logger');
var passport = require('passport');
var path = require('path');
var session = require('express-session');
var stylus = require('stylus');

var redisStore = require('connect-redis')(session);

var authorize = require('./routes/authorize');
var calendar = require('./routes/calendar');
var category = require('./routes/category');
var home = require('./routes/home');
var myAccount = require('./routes/my_account');
var groceryList = require('./routes/grocery_list');
var recipe = require('./routes/recipe');
var stripe = require('./routes/stripe');
var subscription = require('./routes/subscription');
var user = require('./routes/user');

require('./config/passport')(passport);

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new redisStore({
    url: process.env.REDISCLOUD_URL
  })
}));

app.use(passport.initialize());
app.use(passport.session());

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    }
    else {
      req.flash('originalUrl', req.originalUrl);

      res.redirect('/log-in');
    }
}

function isSubscribed(req, res, next) {
  if (req.user.subscriptionStatus) {
    next();
  }
  else {
    req.flash('errorMessage', 'Please subscribe in order to access that feature.');

    res.redirect('/subscription');
  }
}

app.use('/', home);
app.use('/', user);
app.use('/', stripe);

app.use('/', isLoggedIn, myAccount);
app.use('/', isLoggedIn, subscription);

app.use('/', isLoggedIn, isSubscribed, authorize);
app.use('/', isLoggedIn, isSubscribed, calendar);
app.use('/', isLoggedIn, isSubscribed, category);
app.use('/', isLoggedIn, isSubscribed, groceryList);
app.use('/', isLoggedIn, isSubscribed, recipe);

app.use(function(req, res) {
  logger.error("Unable to find {path = %s}", req.originalUrl);

  res.status(404);

  res.redirect('/');
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);

  req.flash('errorMessage', 'An unexpected error has occurred.');

  res.redirect('/');
});

module.exports = app;
