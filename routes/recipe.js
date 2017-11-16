var async = require('async');
var connection = require('../connection');
var crypto = require('crypto');
var express = require('express');
var logger = require('../logger');
var router = express.Router();
var sendgrid = require('@sendgrid/mail');

const emailAddressRegex = new RegExp("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$");

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
sendgrid.setSubstitutionWrappers('{{', '}}');

router.post('/add-recipe', function(req, res) {
  var recipeName = req.body.name;

  var ingredients = req.body.ingredients;
  var directions = req.body.directions;

  var category = req.body.category;

  var categoryId = 0;
  var categoryName = "No Category";

  if (category !== undefined) {
    category = category.split(",");

    categoryId = category[0];
    categoryName = category[1];
  }

  async.waterfall([
    function getExistingRecipe(callback) {
      connection.query('SELECT COUNT(*) as recipeCount FROM Recipe WHERE ? AND ?', [{name: recipeName}, {userId: req.user.userId}], function(err, rows) {
        if (err) {
          callback(err);
        }
        else if (rows[0].recipeCount > 0) {
          req.flash('errorMessage', 'There is already a recipe with this name.');

          req.flash('categoryId', categoryId);
          req.flash('directions', directions);
          req.flash('ingredients', ingredients);
          req.flash('name', recipeName);

          return res.redirect('/view-recipes')
        }
        else {
          callback(err);
        }
      });
    },
    function addRecipe(callback) {
      ingredients = ingredients.trim().replace(/\r?\n|\r/g, ",");

      connection.query('INSERT INTO Recipe(name, ingredients, directions, categoryId, categoryName, shareHash, userId) VALUES(?, ?, ?, ?, ?, ?, ?)', [recipeName, ingredients, directions, categoryId, categoryName, crypto.randomBytes(8).toString('hex'), req.user.userId], function(err) {
        callback(err);
      })
    }
  ], function(err) {
    if (err) {
      logger.error("Unable to add recipe for {userId = %s, categoryId = %s, directions = %s, ingredients = %s, name = %s}", req.user.userId, categoryId, directions, ingredients, recipeName);
      logger.error(err);
  
      req.flash('errorMessage', 'The recipe was unable to be added.');
      req.flash('categoryId', categoryId);
      req.flash('directions', directions);
      req.flash('ingredients', ingredients);
      req.flash('name', recipeName);
    }
    else {
      req.flash('successMessage', 'The recipe was added successfully.');
    }

    res.redirect('/view-recipes');
  })
});

router.get('/copy-recipe/:hash', function(req, res, next) {
  async.waterfall([
    function getRecipe(callback) {
      connection.query('SELECT * FROM Recipe WHERE ?', {shareHash: req.params.hash}, function (err, rows) {
        if (err) {
          callback(err);
        }
        else if (rows.length === 0) {
          callback("No recipe matches hash - " + req.params.hash);
        }
        else {
          callback(null, rows[0]);
        }
      });
    },
    function renderRecipe(recipe) {
      getCategories(req.user.userId, next, function(categoryRows) {
        return res.render('copy_recipe', {
          categories: categoryRows,
          directions: recipe.directions,
          infoMessage: "",
          ingredients: recipe.ingredients,
          name: recipe.name,
          title: "Copy Recipe",
          user: req.user
        });
      });
    }
  ], function(err) {
    if (err) {
      logger.error("Unable to copy recipe for {userId = %s, shareHash = %s}", req.user.userId, req.params.hash);
      logger.error(err);

      req.flash('errorMessage', 'The recipe was unable to be copied.');
    }

    res.redirect('/view-recipes');
  });
});

router.get('/edit-recipe/:recipeId', function(req, res, next) {
  getCategories(req.user.userId, next, function(categoryRows) {
    var errorMessage = req.flash('errorMessage');

    if (errorMessage && errorMessage.length) {
      res.render('edit_recipe', {
        categoryId: req.flash('categoryId'),
        categories: categoryRows,
        directions: req.flash('directions'),
        errorMessage: errorMessage,
        ingredients: req.flash('ingredients'),
        name: req.flash('name'),
        recipeId: req.params.recipeId,
        title: "Edit Recipe",
        user: req.user
      });
    }
    else {
      connection.query('SELECT * FROM Recipe WHERE ? AND ?', [{recipeId: req.params.recipeId}, {userId: req.user.userId}], function (err, rows) {
        if (err || rows.length === 0) {
          logger.error("Unable to find recipe for {recipeId = %s, userId = %s}", req.params.recipeId, req.user.userId);
          logger.error(err);

          req.flash('errorMessage', 'The recipe was unable to be found.');

          res.redirect('/view-recipes');
        }
        else {
          res.render('edit_recipe', {
            categoryId: rows[0].categoryId,
            categories: categoryRows,
            directions: rows[0].directions,
            ingredients: rows[0].ingredients.replace(/,/g, "\r\n"),
            name: rows[0].name,
            recipeId: req.params.recipeId,
            title: "Edit Recipe",
            user: req.user
          });
        }
      });
    }
  });
});

router.post('/edit-recipe', function(req, res) {
  if (req.body.action === "Save Recipe") {
    var recipeName = req.body.name;

    var ingredients = req.body.ingredients;
    var directions = req.body.directions;

    var category = req.body.category;

    var categoryId = 0;
    var categoryName = "No Category";
  
    if (category !== undefined) {
      category = category.split(",");
  
      categoryId = category[0];
      categoryName = category[1];
    }

    connection.beginTransaction(function (err) {
      if (err) {
        logger.error("Unable to begin transaction to edit recipe for {userId = %s, recipeId = %s, categoryId = %s, directions = %s, ingredients = %s, name = %s}", req.user.userId, req.body.recipeId, categoryId, directions, ingredients, recipeName);
        logger.error(err);

        req.flash('errorMessage', 'The recipe was unable to be updated.');
        req.flash('categoryId', categoryId);
        req.flash('directions', directions);
        req.flash('ingredients', ingredients);
        req.flash('name', recipeName);

        return res.redirect('/edit-recipe/' + req.body.recipeId);
      }

      async.waterfall([
        function getExistingRecipe(callback) {
          connection.query('SELECT COUNT(*) as recipeCount FROM Recipe WHERE name = ? AND userId = ? AND recipeId != ?', [recipeName, req.user.userId, req.body.recipeId], function (err, rows) {
            if (err) {
              callback(err);
            }
            else if (rows[0].recipeCount > 0) {
              req.flash('errorMessage', 'There is already a recipe with this name.');

              req.flash('categoryId', categoryId);
              req.flash('directions', directions);
              req.flash('ingredients', ingredients);
              req.flash('name', recipeName);

              return res.redirect('/edit-recipe/' + req.body.recipeId);
            }
            else {
              callback(err);
            }
          });
        },
        function updateRecipe(callback) {
          ingredients = ingredients.trim().replace(/\r?\n|\r/g, ",");

          connection.query('UPDATE Recipe SET ? WHERE ? AND ?', [{
            name: recipeName,
            ingredients: ingredients,
            directions: directions,
            categoryId: categoryId,
            categoryName: categoryName
          }, {recipeId: req.body.recipeId}, {userId: req.user.userId}], function (err) {
            callback(err);
          })
        },
        function updateCalendar(callback) {
          connection.query('UPDATE Calendar SET ? WHERE ? AND ?', [{recipeName: recipeName}, {recipeId: req.body.recipeId}, {userId: req.user.userId}], function(err) {
            callback(err);
          })
        },
        function commitUpdates(callback) {
          connection.commit(function (err) {
            callback(err);
          })
        }
      ], function (err) {
        if (err) {
          logger.error("Unable to begin transaction to edit recipe for {userId = %s, recipeId = %s, categoryId = %s, directions = %s, ingredients = %s, name = %s}", req.user.userId, req.body.recipeId, categoryId, directions, ingredients, recipeName);
          logger.error(err);

          req.flash('errorMessage', 'The recipe was unable to be updated.');
          req.flash('categoryId', categoryId);
          req.flash('directions', directions);
          req.flash('ingredients', ingredients);
          req.flash('name', recipeName);

          return res.redirect('/edit-recipe/' + req.body.recipeId);
        }
        else {
          req.flash('successMessage', 'The recipe was updated successfully.');
        }

        res.redirect('/view-recipes');
      });
    });
  }
  else {
    connection.beginTransaction(function (err) {
      if (err) {
        logger.error("Unable to begin transaction to delete recipe for {userId = %s, recipeId = %s, categoryId = %s, directions = %s, ingredients = %s, name = %s}", req.user.userId, req.body.recipeId, categoryId, directions, ingredients, recipeName);
        logger.error(err);

        req.flash('errorMessage', 'The recipe was unable to be updated.');
        req.flash('categoryId', categoryId);
        req.flash('directions', directions);
        req.flash('ingredients', ingredients);
        req.flash('name', recipeName);

        return res.redirect('/edit-recipe/' + req.body.recipeId);
      }

      async.waterfall([
        function deleteRecipe(callback) {
          connection.query('DELETE FROM Recipe WHERE ? AND ?', [ {recipeId: req.body.recipeId}, {userId: req.user.userId} ], function(err) {
            callback(err);
          });
        },
        function deleteRecipeFromCalendar(callback) {
          connection.query('DELETE FROM Calendar WHERE ? AND ?', [ {recipeId: req.body.recipeId}, {userId: req.user.userId} ], function(err) {
            callback(err);
          });
        },
        function commitDeletions(callback) {
          connection.commit(function (err) {
            callback(err);
          })
        }
      ], function (err) {
        if (err) {
          logger.error("Unable to begin transaction to delete recipe for {userId = %s, recipeId = %s, categoryId = %s, directions = %s, ingredients = %s, name = %s}", req.user.userId, req.body.recipeId, categoryId, directions, ingredients, recipeName);
          logger.error(err);

          req.flash('errorMessage', 'The recipe was unable to be deleted.');

          return res.redirect('/edit-recipe/' + req.body.recipeId);
        }
        else {
          req.flash('successMessage', 'The recipe was deleted successfully.');

          res.redirect('/view-recipes');
        }
      });
    });
  }
});

router.post('/share-recipe', function(req, res) {
  var data = {};

  var emailAddress = req.body.emailAddress;

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
    function fetchRecipe(callback) {
      connection.query('SELECT * FROM Recipe WHERE ? AND ?', [{recipeId: req.body.recipeId}, {userId: req.user.userId}], function (err, rows) {
        callback(err, rows[0]);
      });
    },
    function sendEmail(recipe, callback) {
      var message = {
        to: emailAddress,
        from: {
          email: 'no-reply@quickmealplanner.com',
          name: 'Quick Meal Planner'
        },
        subject: 'Quick Meal Planner - ' + recipe.name + ' recipe has been shared',
        templateId: process.env.SENDGRID_SHARE_RECIPE_TEMPLATE_ID,
        asm: {
          groupId: parseInt(process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID)
        },
        substitutions: {
          name: recipe.name,
          ingredients: "<li>" + recipe.ingredients.replace(/,/g, "</li><li>") + "</li>",
          directions: recipe.directions.replace(/\r?\n/g, "<br>"),
          hash: recipe.shareHash
        }
      };

      sendgrid.send(message, function (err) {
        callback(err);
      });
    }
  ], function(err) {
    if (err) {
      logger.error("Unable to share recipe for {userId = %s, recipeId = %s, recipientEmailAddress = %s}", req.user.userId, req.body.recipeId, emailAddress);
      logger.error(err);

      data.error = "An unexpected error has occurred.";

      res.send(data);
    }
    else {
      data.success = "You have successfully shared your recipe.";

      res.send(data);
    }
  });
});

router.get('/view-recipes', function(req, res, next) {
  var categoryRecipeMap = {};

  getCategories(req.user.userId, next, function(categoryRows) {
    getRecipes(req.user.userId, next, function(recipeRows) {
      if (recipeRows.length === 0) {
        res.render('view_recipes', {
          categoryId: req.flash('categoryId'),
          categories: categoryRows,
          directions: req.flash('directions'),
          errorMessage: req.flash('errorMessage'),
          ingredients: req.flash('ingredients'),
          name: req.flash('name'),
          successMessage: req.flash('successMessage'),
          title: "Recipes",
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

        res.render('view_recipes', {
          categoryId: req.flash('categoryId'),
          categoryRecipes: categoryRecipeMap,
          categories: categoryRows,
          directions: req.flash('directions'),
          errorMessage: req.flash('errorMessage'),
          ingredients: req.flash('ingredients'),
          name: req.flash('name'),
          successMessage: req.flash('successMessage'),
          title: "Recipes",
          user: req.user
        });
      }
    });
  });
});

function getCategories(userId, next, callback) {
  connection.query('SELECT * FROM Category WHERE ? ORDER BY name', {userId: userId}, function(err, rows) {
    if (err) {
      logger.error("Unable to get categories for {userId = %s}", userId);
      logger.error(err);

      return next(err);
    }
    else {
      callback(rows);
    }
  });
}

function getRecipes(userId, next, callback) {
  connection.query('SELECT * FROM Recipe WHERE ? ORDER BY categoryName, name', {userId: userId}, function(err, rows) {
    if (err) {
      logger.error("Unable to get recipes for {userId = %s}", userId);
      logger.error(err);

      return next(err);
    }
    else {
      callback(rows);
    }
  });
}

module.exports = router;