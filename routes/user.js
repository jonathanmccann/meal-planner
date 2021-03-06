var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var connection = require('../connection');
var crypto = require('crypto');
var expressBrute = require('express-brute');
var express = require('express');
var logger = require('../logger');
var redis = require('../redis');
var sendgrid = require('@sendgrid/mail');
var passport = require('passport');
var router = express.Router();

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
sendgrid.setSubstitutionWrappers('{{', '}}');

var failCallback = function (req, res) {
  var originalUrl = req.originalUrl;

  if ((originalUrl === '/log-in') || (originalUrl === '/reset-password')) {
    req.flash('errorMessage', "You've made too many attempts in a short period of time. Please try again later.");
  }
  else if (originalUrl === '/forgot-password') {
    req.flash('errorMessage', "You've requested too many password reset links in a short period of time. Please try again later.")
  }
  else {
    req.flash('errorMessage', "You've made too many attempts in a short period of time. Please try again later.");

    originalUrl = '/log-in';
  }

  res.redirect(originalUrl);
};

var handleStoreError = function (err) {
  logger.error("Brute force store error occurred");
  logger.error(err);
};

var userBruteForce = new expressBrute(redis.expressBruteRedisStore, {
  freeRetries: 2,
  minWait: 60*1000,
  maxWait: 60*60*1000,
  failCallback: failCallback,
  handleStoreError: handleStoreError
});

function getPasswordResetToken() {
  var buffer = crypto.randomBytes(20);

  return buffer.toString('hex');
}

function getPasswordResetExpiration() {
  return Math.floor((Date.now() + 3600000) / 1000);
}

router.get('/create-account', function(req, res) {
  res.render('create_account', {
    errorMessage: req.flash('errorMessage'),
    successMessage: req.flash('successMessage'),
    title: "Create an Account",
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

router.get('/forgot-password', function(req, res) {
  res.render('forgot_password', {
    errorMessage: req.flash('errorMessage'),
    successMessage: req.flash('successMessage'),
    title: "Forgot Password"
  })
});

router.post('/forgot-password', userBruteForce.prevent, function(req, res) {
  var emailAddress = req.body.emailAddress;

  async.waterfall([
    function getUser(callback) {
      connection.query('SELECT * FROM User_ WHERE ?', {emailAddress: emailAddress}, function(err, rows) {
        if (!rows.length) {
          err = "Unable to find user with email address - " + emailAddress;
        }

        callback(err);
      });
    },
    function setPasswordResetTokenAndExpiration(callback) {
      var passwordResetToken = getPasswordResetToken();

      connection.query('UPDATE User_ SET ? WHERE ?', [{passwordResetToken: passwordResetToken, passwordResetExpiration: getPasswordResetExpiration()}, {emailAddress: emailAddress}], function(err) {
        callback(err, passwordResetToken);
      })
    },
    function emailPasswordResetLink(passwordResetToken, callback) {
      var message = {
        to: emailAddress,
        from: {
          email: 'no-reply@quickmealplanner.com',
          name: 'Quick Meal Planner'
        },
        subject: 'Quick Meal Planner - Password Reset Link',
        templateId: process.env.SENDGRID_FORGOT_PASSWORD_TEMPLATE_ID,
        substitutions: {
          passwordResetToken: passwordResetToken
        }
      };

      sendgrid.send(message, function(err) {
        callback(err);
      });
    }
  ], function (err) {
    if (err) {
      logger.error("Unable to perform forgot password for {emailAddress = %s}", emailAddress);
      logger.error(err);
    }
    else {
      req.brute.reset();
    }

    req.flash('successMessage', 'Your password reset link has been sent to your email.');

    res.redirect('/forgot-password');
  });
});

router.get('/log-in', function(req, res) {
  res.render('log_in', {
    errorMessage: req.flash('errorMessage'),
    originalUrl: req.flash('originalUrl'),
    successMessage: req.flash('successMessage'),
    title: "Log In",
    user: req.user
  });
});

router.post('/log-in', userBruteForce.prevent, function(req, res, next) {
  passport.authenticate('log-in', function(err, user) {
  	if (err) {
  	  logger.error(err);

  		return next(err);
		}
		else if (!user) {
		  req.flash('originalUrl', req.body.originalUrl);

  		return res.redirect('/log-in');
		}

		req.logIn(user, function(err) {
			if (err) {
			  logger.error(err);

				return next(err);
			}

      req.brute.reset();

      if (req.body.originalUrl === "") {
        return res.redirect('/');
      }
      else {
        return res.redirect(req.body.originalUrl);
      }
		})
  })(req, res, next);
});

router.get('/log-out', function(req, res) {
  req.logout();

  req.flash('successMessage', 'You have logged out successfully.');

  res.redirect('/log-in');
});

router.get('/reset-password/:passwordResetToken', userBruteForce.prevent, function(req, res) {
  var passwordResetToken = req.params.passwordResetToken;

  async.waterfall([
    function getUser(callback) {
      connection.query('SELECT * FROM User_ WHERE passwordResetToken = ? and passwordResetExpiration > ?', [passwordResetToken, Date.now() / 1000], function(err, rows) {
        callback(err, rows);
      });
    },
    function validateUser(rows, callback) {
      if (!rows.length) {
        var err = "Unable to find user with password reset token - " + passwordResetToken;
      }

      callback(err);
    }
  ], function(err) {
    if (err) {
      logger.error("Unable to get reset password");
      logger.error(err);

      req.flash('errorMessage', 'Your password reset link is either expired or invalid. Please request a new link.');
    
      res.redirect('/forgot-password');
    }
    else {
      req.brute.reset();

      res.render('reset_password', {
        passwordResetToken: passwordResetToken,
        title: "Reset Password"
      });
    }
  })
});

router.post('/reset-password', userBruteForce.prevent, function(req, res) {
  var passwordResetToken = req.body.passwordResetToken;

  async.waterfall([
    function getUser(callback) {
      connection.query('SELECT * FROM User_ WHERE passwordResetToken = ? and passwordResetExpiration > ?', [passwordResetToken, Date.now() / 1000], function(err, rows) {
        callback(err, rows);
      });
    },
    function validateUser(rows, callback) {
      if (!rows.length) {
        var err = "Unable to find user with password reset token - " + passwordResetToken;
      }

      callback(err);
    },
    function updatePassword(callback) {
      connection.query('UPDATE User_ SET ? WHERE ?', [{password: bcrypt.hashSync(req.body.password), passwordResetToken: "", passwordResetExpiration: 0}, {passwordResetToken: passwordResetToken}], function (err) {
        callback(err);
      });
    }
  ], function(err) {
    if (err) {
      logger.error("Unable to reset password");
      logger.error(err);

      req.flash('errorMessage', 'Your password reset link is either expired or invalid. Please request a new link.');
    
      res.redirect('/forgot-password');
    }
    else {
      req.flash('successMessage', 'Your password was changed successfully. Please log in.');

      res.redirect('/log-in');
    }
  })
});

module.exports = router;