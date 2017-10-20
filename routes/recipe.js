var async = require('async');
var connection = require('../connection');
var express = require('express');
var router = express.Router();

router.post('/add-recipe', function(req, res) {
  var recipeName = req.body.name;

  var ingredients = req.body.ingredients;

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

      connection.query('INSERT INTO Recipe(name, ingredients, categoryId, categoryName, userId) VALUES(?, ?, ?, ?, ?)', [recipeName, ingredients, categoryId, categoryName, req.user.userId], function(err) {
        callback(err);
      })
    }
  ], function(err) {
    if (err) {
      console.log(err);

      req.flash('errorMessage', 'The recipe was unable to be added.');
    }
    else {
      req.flash('successMessage', 'The recipe was added successfully.');
    }

    res.redirect('/view-recipes');
  })
});

router.get('/edit-recipe/:recipeId', function(req, res) {
  getCategories(req.user.userId, function(categoryRows) {
    var errorMessage = req.flash('errorMessage');

    if (errorMessage && errorMessage.length) {
      console.log("Stepped in");

      res.render('edit_recipe', {
        categoryId: req.flash('categoryId'),
        categories: categoryRows,
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
          console.error(err);

          req.flash('errorMessage', 'The recipe was unable to be found.');

          res.redirect('/view-recipes');
        }
        else {
          res.render('edit_recipe', {
            categoryId: rows[0].categoryId,
            categories: categoryRows,
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
  if (req.body.action === "Edit Recipe") {
    var recipeName = req.body.name;

    var ingredients = req.body.ingredients

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
            req.flash('ingredients', ingredients);
            req.flash('name', recipeName);
  
            return res.redirect('/edit-recipe/' + req.body.recipeId);
          }
          else {
            callback(err);
          }
        });
      },
      function addRecipe(callback) {
        ingredients = ingredients.trim().replace(/\r?\n|\r/g, ",");
  
        connection.query('UPDATE Recipe SET ? WHERE ? AND ?', [ {name: recipeName, ingredients: ingredients, categoryId: categoryId, categoryName: categoryName}, { recipeId: req.body.recipeId}, {userId: req.user.userId}], function(err) {
          callback(err);
        })
      }
    ], function(err) {
      if (err) {
        console.log(err);
  
        req.flash('errorMessage', 'The recipe was unable to be updated.');
      }
      else {
        req.flash('successMessage', 'The recipe was updated successfully.');
      }
  
      res.redirect('/view-recipes');
    });
  }
  else {
    connection.query('DELETE FROM Recipe WHERE ? AND ?', [ {recipeId: req.body.recipeId}, {userId: req.user.userId} ], function(err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The recipe was unable to be deleted.');
      }
      else {
        req.flash('successMessage', 'The recipe was deleted successfully.');
      }

      res.redirect('/view-recipes');
    });
  }
});

router.get('/view-recipes', function(req, res) {
  var categoryRecipeMap = {};

  getCategories(req.user.userId, function(categoryRows) {
    getRecipes(req.user.userId, function(recipeRows) {
      if (recipeRows.length === 0) {
        res.render('view_recipes', {
          categories: categoryRows,
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

        console.log("Category rows = " + categoryRows.length);

        res.render('view_recipes', {
          categoryId: req.flash('categoryId'),
          categoryRecipes: categoryRecipeMap,
          categories: categoryRows,
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

function getCategories(userId, callback) {
  connection.query('SELECT * FROM Category WHERE ? ORDER BY name', {userId: userId}, function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      callback(rows);
    }
  });
}

function getRecipes(userId, callback) {
  connection.query('SELECT * FROM Recipe WHERE ? ORDER BY categoryName, name', {userId: userId}, function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      callback(rows);
    }
  });
}

module.exports = router;