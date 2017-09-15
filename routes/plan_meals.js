var async = require('async');
var connection = require('../connection');
var express = require('express');
var router = express.Router();
var wunderlist = require('./wunderlist');

router.post('/add-ingredients', function(req, res) {
  var calls = [];

  for (var ingredient in req.body) {
    (function(innerIngredient) {
      calls.push(function (callback) {
        wunderlist.addTask(req.user.wunderlistAccessToken, req.user.wunderlistListId, innerIngredient, function (err) {
          if (err) {
            console.error("An error occurred while adding ingredients");
            console.error(err.error);

            callback(err);
          }
          else {
            callback(null);
          }
        })
      });
    })(ingredient);
  }

  async.parallel(calls, function(err) {
    if (err) {
      req.flash('errorMessage', 'The ingredients were unable to be added to Wunderlist.');

      return res.redirect('/add-ingredients');
    }
    else {
      req.flash('successMessage', 'The ingredients were added to Wunderlist successfully.');

      return res.redirect('/add-ingredients');
    }
  });
});

router.get('/plan-meals', function(req, res) {
  var categoryRecipeMap = {};

  connection.query('SELECT * FROM Recipe WHERE recipeId IN (SELECT recipeId FROM Calendar WHERE ?)', {userId: req.user.userId}, function(err, recipeRows) {
    if (recipeRows.length === 0) {
      res.render('add_ingredients', {
        errorMessage: req.flash('errorMessage'),
        successMessage: req.flash('successMessage'),
        title: "Plan Meals",
        user: req.user
      });
    }
    else {
      for (var i = 0; i < recipeRows.length; i++) {
        var categoryName = recipeRows[i].categoryName;

        if (!categoryRecipeMap[categoryName]) {
          categoryRecipeMap[categoryName] = [];
        }

        categoryRecipeMap[categoryName].push(recipeRows[i]);
      }

      res.render('add_ingredients', {
        categoryRecipes: categoryRecipeMap,
        errorMessage: req.flash('errorMessage'),
        infoMessage: req.flash('infoMessage'),
        recipes: recipeRows,
        successMessage: req.flash('successMessage'),
        title: "Plan Meals",
        user: req.user
      });
    }
  });
});

module.exports = router;