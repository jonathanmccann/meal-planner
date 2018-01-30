var async = require('async');
var connection = require('../connection');
var express = require('express');
var logger = require('../logger');
var router = express.Router();
var sendgrid = require('@sendgrid/mail');

const emailAddressRegex = new RegExp("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$");

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const breakfastBitwseValue = 1;
const lunchBitwseValue = 2;
const dinnerBitwseValue = 4;

router.get('/', function(req, res) {
  if ((req.user) && (req.user.subscriptionStatus)) {
    async.waterfall([
      function getCalendarRows(callback) {
        connection.query('SELECT Calendar.mealKey, Recipe.name, Recipe.ingredients, Recipe.directions FROM Calendar INNER JOIN Recipe ON Calendar.recipeId = Recipe.recipeId WHERE Calendar.userId = ?', [req.user.userId], function(err, calendarRows) {
          callback(err, calendarRows);
        });
      }
    ], function (err, calendarRows) {
      if (err) {
        logger.error("Unable to populate home calendar for {userId = %s}", req.user.userId);
        logger.error(err);

        res.render('home', {
          calendarError: "Unable to populate calendar",
          errorMessage: req.flash('errorMessage'),
          title: "Quick Meal Planner",
          user: req.user
        });
      }
      else {
        var calendarDayAndRecipeMap = {};

        for (var i = 0; i < calendarRows.length; i++) {
          var mealKey = calendarRows[i].mealKey;

          if (!calendarDayAndRecipeMap[mealKey]) {
            calendarDayAndRecipeMap[mealKey] = [];
          }

          calendarDayAndRecipeMap[mealKey].push(calendarRows[i].name, calendarRows[i].ingredients, calendarRows[i].directions);
        }

        res.render('home', {
          calendarDayAndRecipeMap: JSON.stringify(calendarDayAndRecipeMap),
          displayBreakfast: req.user.mealsToDisplay & breakfastBitwseValue,
          displayLunch: req.user.mealsToDisplay & lunchBitwseValue,
          displayDinner: req.user.mealsToDisplay & dinnerBitwseValue,
          errorMessage: req.flash('errorMessage'),
          successMessage: req.flash('successMessage'),
          title: "Quick Meal Planner",
          user: req.user
        });
      }
    });
  }
  else {
    res.render('home', {
      title: "Quick Meal Planner",
      user: req.user
    });
  }
});

router.post('/send-message', function(req, res) {
  var data = {};

  var emailAddress = req.body.emailAddress;
  var message = req.body.message;

  async.waterfall([
    function validateEmailAddress(callback) {
      if (!emailAddressRegex.test(emailAddress)) {
        data.error = "Please enter a valid email address.";
    
        return res.send(data);
      }
      else {
        callback();
      }
    },
    function sendEmail(callback) {
      var email = {
        to: 'contact@quickmealplanner.com',
        from: emailAddress,
        subject: 'You Have A New Message From ' + emailAddress,
        text: message
      };

      sendgrid.send(email, function (err) {
        callback(err);
      });
    }
  ], function(err) {
    if (err) {
      logger.error("Unable to send message for {emailAddress = %s, message = %s}", emailAddress, message);
      logger.error(err);

      data.error = "An unexpected error has occurred.";

      res.send(data);
    }
    else {
      data.success = "Your message has been sent successfully. We will get back to you as soon as possible.";

      res.send(data);
    }
  });
});

module.exports = router;