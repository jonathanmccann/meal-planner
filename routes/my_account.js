var async = require('async');
var bcrypt = require('bcrypt-nodejs');
var connection = require('../connection');
var express = require('express');
var router = express.Router();

const breakfastBitwseValue = 1;
const lunchBitwseValue = 2;
const dinnerBitwseValue = 4;

router.get('/my-account', function(req, res) {
  res.render('my_account', {
    displayBreakfast: req.user.mealsToDisplay & breakfastBitwseValue,
    displayLunch: req.user.mealsToDisplay & lunchBitwseValue,
    displayDinner: req.user.mealsToDisplay & dinnerBitwseValue,
    errorMessage: req.flash('errorMessage'),
    infoMessage: req.flash('infoMessage'),
    successMessage: req.flash('successMessage'),
    title: "My Account",
    user: req.user
  });
});

router.post('/update-calendar', function(req, res) {
  var mealsToDisplay = 0;

  var displayBreakfast = req.body.displayBreakfast;
  var displayLunch = req.body.displayLunch;
  var displayDinner = req.body.displayDinner;

  if (displayBreakfast) {
    mealsToDisplay += breakfastBitwseValue;
  }

  if (displayLunch) {
    mealsToDisplay += lunchBitwseValue;
  }

  if (displayDinner) {
    mealsToDisplay += dinnerBitwseValue;
  }

  if (mealsToDisplay > 0) {
    connection.query('UPDATE User_ SET ? WHERE ?', [{mealsToDisplay: mealsToDisplay}, {userId: req.user.userId}], function (err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'Your calendar was unable to be updated.');
      }
      else {
        req.flash('successMessage', 'Your calendar was updated successfully.');
      }

      res.redirect('/my-account');
    });
  }
  else {
    req.flash('errorMessage', 'You must display at least one meal on the calendar.');

    res.redirect('/my-account');
  }
});

router.post('/update-email', function(req, res) {
  var emailAddress = req.body.emailAddress;

  connection.query('UPDATE User_ SET ? WHERE ?', [{emailAddress: emailAddress}, {userId: req.user.userId}], function(err) {
  	if (err) {
      console.error(err);

      req.flash('errorMessage', 'Your email address was unable to be updated.');
  	}
  	else {
  	  req.flash('successMessage', 'Your email address was updated successfully.');
  	}

  	res.redirect('/my-account');
  })
});

router.post('/update-password', function(req, res) {
  var currentPassword = req.body.currentPassword;
  var newPassword = req.body.newPassword;

  async.waterfall([
    function getUser(callback) {
      connection.query('SELECT * FROM User_ WHERE ?', {userId: req.user.userId}, function(err, rows) {
        callback(err, rows);
      });
    },
    function validatePassword(rows, callback) {
      if (!rows.length || !bcrypt.compareSync(currentPassword, rows[0].password)) {
        var err = "Unable to validate passwords";
      }

      callback(err);
    },
    function updatePassword(callback) {
      connection.query('UPDATE User_ SET ? WHERE ?', [{password: bcrypt.hashSync(newPassword)}, {userId: req.user.userId}], function(err) {
        callback(err);
      })
    }
  ], function (err) {
    if (err) {
      console.error(err);

      req.flash('errorMessage', 'Your password was unable to be updated.');

      res.redirect('/my-account');
    }
    else {
      req.flash('successMessage', 'Your password was updated successfully.');

      res.redirect('/my-account');
    }
  })
});

module.exports = router;