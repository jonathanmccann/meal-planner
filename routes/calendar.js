var async = require('async');
var connection = require('../connection');
var express = require('express');
var logger = require('../logger');
var router = express.Router();

const breakfastBitwseValue = 1;
const lunchBitwseValue = 2;
const dinnerBitwseValue = 4;

router.get('/calendar', function(req, res) {
  async.waterfall([
    function getRecipes(callback) {
      connection.query('SELECT Calendar.mealKey, Calendar.recipeId, Recipe.name FROM Calendar INNER JOIN Recipe ON Calendar.recipeId = Recipe.recipeId WHERE Calendar.userId = ?', [req.user.userId], function(err, calendarRows) {
        callback(err, calendarRows);
      });
    },
    function getMealPlans(calendarRows, callback) {
      connection.query('SELECT * FROM MealPlan WHERE ?', {userId: req.user.userId}, function(err, mealPlanRows) {
        callback(err, calendarRows, mealPlanRows);
      });
    },
    function getRecipes(calendarRows, mealPlanRows, callback) {
 			connection.query('SELECT * FROM Recipe WHERE ? ORDER BY categoryName, name', {userId: req.user.userId}, function (err, recipeRows) {
        callback(err, calendarRows, mealPlanRows, recipeRows);
      });
    }
  ], function (err, calendarRows, mealPlanRows, recipeRows) {
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
      var calendarDayAndRecipeMap = {};

      for (var i = 0; i < calendarRows.length; i++) {
        var mealKey = calendarRows[i].mealKey;

        if (!calendarDayAndRecipeMap[mealKey]) {
          calendarDayAndRecipeMap[mealKey] = [];
        }

        calendarDayAndRecipeMap[mealKey].push([calendarRows[i].recipeId, calendarRows[i].name]);
      }

      var recipeMaps = createRecipeMaps(recipeRows);

      var categoryRecipeMap = recipeMaps[0];
      var recipes = recipeMaps[1];

      res.render('calendar', {
        calendarDayAndRecipeMap: calendarDayAndRecipeMap,
        categoryRecipes: categoryRecipeMap,
        displayBreakfast: req.user.mealsToDisplay & breakfastBitwseValue,
        displayLunch: req.user.mealsToDisplay & lunchBitwseValue,
        displayDinner: req.user.mealsToDisplay & dinnerBitwseValue,
        errorMessage: req.flash('errorMessage'),
        isMealPlan: false,
        mealPlans: mealPlanRows,
        recipes: JSON.stringify(recipes),
        successMessage: req.flash('successMessage'),
        test: "test",
        title: "Calendar",
        user: req.user
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

router.get('/meal-plan', function(req, res) {
  async.waterfall([
    function getRecipes(callback) {
 			connection.query('SELECT * FROM Recipe WHERE ? ORDER BY categoryName, name', {userId: req.user.userId}, function (err, recipeRows) {
        callback(err, recipeRows);
      });
    },
    function getMealPlans(recipeRows, callback) {
      connection.query('SELECT * FROM MealPlan WHERE ?', {userId: req.user.userId}, function(err, mealPlanRows) {
        callback(err, recipeRows, mealPlanRows);
      });
    },
    function createMap(recipeRows, mealPlanRows, callback) {
      var recipeMaps = createRecipeMaps(recipeRows);

      var categoryRecipeMap = recipeMaps[0];
      var recipes = recipeMaps[1];

      callback(null, categoryRecipeMap, recipes, mealPlanRows);
    }
  ], function (err, categoryRecipeMap, recipes, mealPlanRows) {
    if (err) {
      logger.error("Unable to display meal plans for {userId = %s}", req.user.userId);
      logger.error(err);

      res.render('meal-plan', {
        errorMessage: "The meal plan was unable to be successfully loaded.",
        title: "Meal Plans",
        user: req.user
      });
    }
    else {
      res.render('calendar', {
        calendarDayAndRecipeMap: null,
        categoryRecipes: categoryRecipeMap,
        displayBreakfast: req.user.mealsToDisplay & breakfastBitwseValue,
        displayLunch: req.user.mealsToDisplay & lunchBitwseValue,
        displayDinner: req.user.mealsToDisplay & dinnerBitwseValue,
        errorMessage: req.flash('errorMessage'),
        isMealPlan: true,
        mealPlans: mealPlanRows,
        recipes: JSON.stringify(recipes),
        successMessage: req.flash('successMessage'),
        test: "test",
        title: "Calendar",
        user: req.user
      });
    }
  });
});

router.post('/meal-plan', function(req, res) {
  var data = {};

  var mealPlanId = req.body.mealPlanId;

  async.waterfall([
    function getMealPlanRecipes(callback) {
      connection.query('SELECT MealPlanRecipe.mealKey, MealPlanRecipe.recipeId, Recipe.name FROM MealPlanRecipe INNER JOIN Recipe ON MealPlanRecipe.recipeId = Recipe.recipeId WHERE MealPlanRecipe.mealPlanId = ? AND MealPlanRecipe.userId = ?', [mealPlanId, req.user.userId], function(err, mealPlanRecipeRows) {
        callback(err, mealPlanRecipeRows)
      });
    },
    function createMap(mealPlanRecipeRows, callback) {
      var calendarDayAndRecipeMap = {};

      for (var i = 0; i < mealPlanRecipeRows.length; i++) {
        var mealKey = mealPlanRecipeRows[i].mealKey;

        if (!calendarDayAndRecipeMap[mealKey]) {
          calendarDayAndRecipeMap[mealKey] = [];
        }

        calendarDayAndRecipeMap[mealKey].push([mealPlanRecipeRows[i].recipeId, mealPlanRecipeRows[i].name]);
      }

      callback(null, calendarDayAndRecipeMap);
    }
  ], function (err, calendarDayAndRecipeMap) {
    if (err) {
      logger.error("Unable to fetch meal plan for {userId = %s, mealPlanId = %s}", req.user.userId, mealPlanId);
      logger.error(err);

      data.error = "An unexpected error has occurred while fetching your meal plan.";

      res.send(data);
    }
    else {
      data.calendarDayAndRecipeMap = calendarDayAndRecipeMap;

      res.send(data);
    }
  });
});

function createRecipeMaps(recipeRows) {
  var categoryRecipeMap = {};
  var recipes = {};

  for (var i = 0; i < recipeRows.length; i++) {
    recipes[recipeRows[i].recipeId] = [];
    recipes[recipeRows[i].recipeId].push(recipeRows[i].name, recipeRows[i].ingredients, recipeRows[i].directions);

    var categoryName = recipeRows[i].categoryName;

    if (!categoryRecipeMap[categoryName]) {
      categoryRecipeMap[categoryName] = [];
    }

    categoryRecipeMap[categoryName].push(recipeRows[i]);
  }

  return [categoryRecipeMap, recipes];
}

module.exports = router;