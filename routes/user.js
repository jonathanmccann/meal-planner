var expressBrute = require('express-brute');
var express = require('express');
var passport = require('passport');
var router = express.Router();

var store = new expressBrute.MemoryStore();

var failCallback = function (req, res) {
  req.flash('errorMessage', "You've made too many failed attempts in a short period of time, please try again later.");
  res.redirect('/log-in');
};

var handleStoreError = function (error) {
  console.error(error);
};

var userBruteForce = new expressBrute(store, {
  freeRetries: 2,
  minWait: 60*1000,
  maxWait: 60*60*1000,
  failCallback: failCallback,
  handleStoreError: handleStoreError
});

router.get('/log-in', function(req, res) {
  res.render('log_in', {
    errorMessage: req.flash('errorMessage'),
    infoMessage: req.flash('infoMessage'),
    successMessage: req.flash('successMessage'),
    title: "Log In",
    user: req.user
  });
});

router.post('/log-in', userBruteForce.prevent, function(req, res, next) {
  passport.authenticate('log-in', {
    successRedirect: '/',
    failureRedirect: '/log-in',
    failureFlash: true
  })(req, res, next);
});

router.get('/log-out', function(req, res) {
  req.logout();

  req.flash('successMessage', 'You have logged out successfully.');

  res.redirect('/log-in');
});

router.get('/create-account', function(req, res) {
  res.render('create_account', {
    errorMessage: req.flash('errorMessage'),
    infoMessage: req.flash('infoMessage'),
    successMessage: req.flash('successMessage'),
    title: "Create Account",
    user: req.user
  });
});

router.post('/create-account', userBruteForce.prevent, function(req, res, next) {
  passport.authenticate('create-account', {
    successRedirect: '/',
    failureRedirect: '/create-account',
    failureFlash: true
  })(req, res, next);
});

module.exports = router;