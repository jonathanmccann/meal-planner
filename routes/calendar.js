var async = require('async');
var connection = require('../connection');
var express = require('express');
var logger = require('../logger');
var router = express.Router();

const breakfastBitwseValue = 1;
const lunchBitwseValue = 2;
const dinnerBitwseValue = 4;

router.get('/calendar', function(req, res) {
  connection.query('SELECT Calendar.mealKey, Calendar.recipeId, Recipe.name FROM meal_planner.Calendar INNER JOIN Recipe ON Calendar.recipeId = Recipe.recipeId WHERE Calendar.userId = 1;', [req.user.userId], function(err, calendarRows) {
    if (err) {
      logger.error("Unable to fetch calendar for {userId = %s}", req.user.userId);
      logger.error(err);

      res.render('calendar', {
        errorMessage: "The calendar was unable to be successfully loaded.",
        title: "Calendar",
        user: req.user
      });
    }
    else {
			connection.query('SELECT * FROM Recipe WHERE ? ORDER BY categoryName, name', {userId: req.user.userId}, function (err, recipeRows) {
				if (err) {
          logger.error("Unable to fetch calendar recipes for {userId = %s}", req.user.userId);
          logger.error(err);

					res.render('calendar', {
						errorMessage: "The calendar was unable to be successfully loaded.",
						title: "Calendar",
						user: req.user
					});
				}
				else {
					var calendarDayAndRecipeMap = {};
					var categoryRecipeMap = {};
					var recipes = {};

					for (var i = 0; i < calendarRows.length; i++) {
						var mealKey = calendarRows[i].mealKey;

						if (!calendarDayAndRecipeMap[mealKey]) {
							calendarDayAndRecipeMap[mealKey] = [];
						}

						calendarDayAndRecipeMap[mealKey].push([calendarRows[i].recipeId, calendarRows[i].name]);
					}

					for (var i = 0; i < recipeRows.length; i++) {
					  recipes[recipeRows[i].recipeId] = [];
					  recipes[recipeRows[i].recipeId].push(recipeRows[i].name, recipeRows[i].ingredients, recipeRows[i].directions);

						var categoryName = recipeRows[i].categoryName;

						if (!categoryRecipeMap[categoryName]) {
							categoryRecipeMap[categoryName] = [];
						}

						categoryRecipeMap[categoryName].push(recipeRows[i]);
					}

					res.render('calendar', {
						calendarDayAndRecipeMap: calendarDayAndRecipeMap,
						categoryRecipes: categoryRecipeMap,
						displayBreakfast: req.user.mealsToDisplay & breakfastBitwseValue,
						displayLunch: req.user.mealsToDisplay & lunchBitwseValue,
						displayDinner: req.user.mealsToDisplay & dinnerBitwseValue,
						errorMessage: req.flash('errorMessage'),
						recipes: JSON.stringify(recipes),
						successMessage: req.flash('successMessage'),
						test: "test",
						title: "Calendar",
						user: req.user
					});
				}
			});
    }
  });
});

router.post('/calendar', function(req, res) {
	if (req.body.action === "Clear Calendar") {
		connection.query('DELETE FROM Calendar WHERE ?', {userId: req.user.userId}, function(err) {
			if (err) {
        logger.error("Unable to delete calendar entries for {userId = %s}", req.user.userId);
        logger.error(err);

				req.flash('errorMessage', 'The calendar was unable to be saved.');

				res.redirect('/calendar');
			}
			else {
				req.flash('successMessage', 'The calendar was cleared successfully.');

				res.redirect('/calendar');
			}
		});
	}
	else {
    connection.beginTransaction(function (err) {
      if (err) {
        logger.error("Unable to begin transaction to edit calendar for {userId = %s}", req.user.userId);
        logger.error(err);

				req.flash('errorMessage', 'The calendar was unable to be saved.');

				res.redirect('/calendar');
      }

      async.waterfall([
        function deleteCurrentCalendar(callback) {
          connection.query('DELETE FROM Calendar WHERE ?', {userId: req.user.userId}, function(err) {
            callback(err)
          });
        },
        function saveCalendar(callback) {
          var meals = [];

          for (var key in req.body) {
            var [recipeId, mealKey] = key.split('_');
  
            var meal = [req.user.userId, recipeId, mealKey];
  
            meals.push(meal);
          }
  
          if (meals.length) {
            connection.query('INSERT INTO Calendar (userId, recipeId, mealKey) VALUES ?', [meals], function (err) {
              callback(err);
            });
          }
        },
        function commitUpdates(callback) {
          connection.commit(function(err) {
            callback(err);
          })
        }
      ], function (err) {
        if (err) {
          logger.error("Unable to edit calendar for {userId = %s}", req.user.userId);
          logger.error(err);

          connection.rollback();

          req.flash('errorMessage', 'The calendar was unable to be saved.');

				  res.redirect('/calendar');
        }
        else {
          req.flash('successMessage', 'The calendar was saved successfully.');

          res.redirect('/calendar');
        }
      });
    });
	}
});

module.exports = router;