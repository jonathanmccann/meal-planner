var async = require('async');
var connection = require('../connection');
var express = require('express');
var logger = require('../logger');
var router = express.Router();
var todoist = require('./todoist');
var wunderlist = require('./wunderlist');

router.post('/add-ingredients', function(req, res) {
  if (req.user.toDoProvider === "Todoist") {
    todoist.addTasks(req.body, req.user.accessToken, req.user.listId, function(err, failedIngredients) {
      if (err) {
        logger.error("Error adding ingredients to Todoist for {userId = %s, listId = %s}", req.user.userId, req.user.listId);
        logger.error(err);

        req.flash('errorMessage', 'The ingredients were unable to be added to your to do list.');
      }
      else if (failedIngredients && failedIngredients.length) {
        logger.error("Error adding ingredients to Todoist for userId = " + req.user.userId + " and listId = " + req.user.listId);
        logger.error("Failed ingredients are = " + failedIngredients);

        req.flash('errorMessage', 'The following ingredients were unable to be added to your to do list:');
        req.flash('failedIngredients', failedIngredients);

        return res.redirect('/grocery-list');
      }
      else {
        req.flash('successMessage', 'The ingredients were added to your to do list successfully.');
      }

      return res.redirect('/grocery-list');
    })
  }
  else if (req.user.toDoProvider === "Wunderlist") {
    wunderlist.addTasks(req.body, req.user.accessToken, req.user.listId, function(err, failedIngredients) {
      if (err) {
        logger.error("Error adding ingredients to Wunderlist for {userId = %s, listId = %s}", req.user.userId, req.user.listId);
        logger.error(err);

        req.flash('errorMessage', 'The ingredients were unable to be added to your to do list.');

        return res.redirect('/grocery-list');
      }
      else if (failedIngredients && failedIngredients.length) {
        logger.error("Error adding ingredients to Wunderlist for userId = " + req.user.userId + " and listId = " + req.user.listId);
        logger.error("Failed ingredients are = " + failedIngredients);

        req.flash('errorMessage', 'The following ingredients were unable to be added to your to do list:');
        req.flash('failedIngredients', failedIngredients);

        return res.redirect('/grocery-list');
      }
      else {
        req.flash('successMessage', 'The ingredients were added to your to do list successfully.');

        return res.redirect('/grocery-list');
      }
    })
  }
});

router.get('/grocery-list', function(req, res) {
  var categoryRecipeMap = {};
  var infoMessage;
  var provider;

  if (req.user.toDoProvider === "Todoist") {
    provider = todoist;
  }
  else if (req.user.toDoProvider === "Wunderlist") {
    provider = wunderlist;
  }

  async.waterfall([
    function getProviderList(callback) {
      if (provider !== undefined) {
        provider.getList(req.user.accessToken, req.user.listId, function (err) {
          if (err) {
            logger.error("Unable to fetch to do list for {userId = %s, listId = %s, provider = %s", req.user.userId, req.user.listId, provider);
            logger.error(err);

            infoMessage = 'Unable to connect with your to do list. If you wish to use a third party to do application, please set up the connection within your account settings.';
          }

          callback();
        });
      }
      else {
        callback();
      }
    },
    function getRecipeIngredients(callback) {
      connection.query('SELECT recipeId, count(recipeId) AS count FROM Calendar WHERE ? GROUP BY recipeId', {userId: req.user.userId}, function(err, recipeCountRows) {
        if (err || (recipeCountRows === undefined) || (recipeCountRows.length === 0)) {
          return callback(err);
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
                infoMessage: infoMessage,
                successMessage: req.flash('successMessage'),
                title: "Grocery List",
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
                failedIngredients: req.flash('failedIngredients'),
                infoMessage: infoMessage,
                recipes: recipeRows,
                successMessage: req.flash('successMessage'),
                title: "Grocery List",
                user: req.user
              });
            }
          });
        }
      });
    }
  ], function(err) {
    var errorMessage = req.flash('errorMessage');

    if (err) {
      logger.error("Unable to get recipe ingredients for {userId = %s}", req.user.userId);
      logger.error(err);

      errorMessage = 'Unable to fetch recipe ingredients.';
    }

    res.render('add_ingredients', {
      errorMessage: errorMessage,
      infoMessage: infoMessage,
      successMessage: req.flash('successMessage'),
      title: "Grocery List",
      user: req.user
    });
  });
});

module.exports = router;