var async = require('async');
var connection = require('../connection');
var express = require('express');
var router = express.Router();
var todoist = require('./todoist');
var wunderlist = require('./wunderlist');

router.post('/add-ingredients', function(req, res) {
  var calls = [];

  var provider;

  if (req.user.toDoProvider === "Todoist") {
    provider = todoist;
  }
  else if (req.user.toDoProvider === "Wunderlist") {
    provider = wunderlist;
  }

  for (var ingredient in req.body) {
    (function(innerIngredient) {
      calls.push(function (callback) {
        provider.addTask(req.user.accessToken, req.user.listId, innerIngredient, function (err) {
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
      req.flash('errorMessage', 'The ingredients were unable to be added to your to do list.');

      return res.redirect('/plan-meals');
    }
    else {
      req.flash('successMessage', 'The ingredients were added to your to do list successfully.');

      return res.redirect('/plan-meals');
    }
  });
});

router.get('/plan-meals', function(req, res) {
  var categoryRecipeMap = {};

  connection.query('SELECT recipeId, count(recipeId) AS count FROM Calendar WHERE ? GROUP BY recipeId', {userId: req.user.userId}, function(err, recipeCountRows) {
    if ((recipeCountRows === undefined) || (recipeCountRows.length === 0)) {
      res.render('add_ingredients', {
        errorMessage: req.flash('errorMessage'),
        successMessage: req.flash('successMessage'),
        title: "Plan Meals",
        user: req.user
      });
    }
    else {
      var recipeIds = [];
      var recipeCount = {};

      for (var i = 0; i < recipeCountRows.length; i++) {
        recipeIds.push(recipeCountRows[i].recipeId);

        recipeCount[recipeCountRows[i].recipeId] = recipeCountRows[i].count;
      }

      var query = "SELECT * FROM Recipe WHERE recipeId IN (" + connection.escape(recipeIds) + ")";

      connection.query(query, function (err, recipeRows) {
        if ((recipeRows === undefined) || (recipeRows.length === 0)) {
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

            if (recipeCount[recipeRows[i].recipeId] > 1) {
              recipeRows[i].name = recipeRows[i].name + ' (' + recipeCount[recipeRows[i].recipeId] + ')';
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
    }
  });
});

module.exports = router;