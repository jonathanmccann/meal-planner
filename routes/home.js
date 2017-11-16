var connection = require('../connection');
var express = require('express');
var logger = require('../logger');
var router = express.Router();

const breakfastBitwseValue = 1;
const lunchBitwseValue = 2;
const dinnerBitwseValue = 4;

router.get('/', function(req, res) {
  if ((req.user) && (req.user.subscriptionStatus)) {
    connection.query('SELECT * FROM Calendar WHERE ?', {userId: req.user.userId}, function(err, calendarRows) {
      if (err) {
        logger.error("Unable to fetch home calendar for {userId = %s}", req.user.userId);
        logger.error(err);

        res.render('home', {
          calendarError: "Unable to fetch calendar",
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

          calendarDayAndRecipeMap[mealKey].push(calendarRows[i].recipeName);
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

module.exports = router;