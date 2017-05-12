var async = require('async');
var config = require('../config');
var connection = require('../connection');
var express = require('express');
var http = require('http');
var request = require('request');
var router = express.Router();
var wunderlist = require('./wunderlist');

router.get('/', function(req, res) {
  res.render('index', { title: "Meal Planner" });
});

router.post('/add-ingredients', function(req, res) {
  var calls = [];

  for (var ingredient in req.body) {
    (function(innerIngredient) {
      calls.push(function (callback) {
        wunderlist.addTask(innerIngredient, function (err) {
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
  
      return res.redirect('/plan-meals');
    }
    else {
      req.flash('successMessage', 'The ingredients were added to Wunderlist successfully.');
  
      return res.redirect('/plan-meals');
    }
  });
});

router.post('/add-recipe', function(req, res) {
  var name = req.body.name;

  var ingredients = req.body.ingredients.trim().replace(/\r?\n|\r/g, ",");

  var category = req.body.category;

  var categoryId = 0;
  var categoryName = "No Category";

  if (category !== undefined) {
    category = category.split(",");

    categoryId = category[0];
    categoryName = category[1];
  }

  connection.query('INSERT INTO Recipe(name, ingredients, categoryId, categoryName) VALUES(?, ?, ?, ?)', [name, ingredients, categoryId, categoryName], function(err) {
  	if (err) {
      console.error(err);

      req.flash('errorMessage', 'The recipe was unable to be added.');
  	}
  	else {
  	  req.flash('successMessage', 'The recipe was added successfully.');
  	}

  	res.redirect('/view-recipes');
  })
});

router.get('/edit-recipe/:recipeId', function(req, res) {
  getCategories(function(categoryRows) {
    connection.query('SELECT * FROM Recipe WHERE recipeId = ?', req.params.recipeId, function(err, rows) {
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
          title: "Edit Recipe"
        });
      }
    });
  });
});

router.post('/edit-recipe', function(req, res) {
  if (req.body.action === "Edit Recipe") {
    var recipeName = req.body.name;

    var ingredients = req.body.ingredients.trim().replace(/\r?\n|\r/g, ",");

    var category = req.body.category;

    var categoryId = 0;
    var categoryName = "No Category";
  
    if (category !== undefined) {
      category = category.split(",");
  
      categoryId = category[0];
      categoryName = category[1];
    }

    connection.query('UPDATE Recipe SET ? WHERE ?', [ {name: recipeName, ingredients: ingredients, categoryId: categoryId, categoryName: categoryName}, { recipeId: req.body.recipeId}], function(err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The recipe was unable to be edited.');
      }
      else {
        console.log("Success edit");
        req.flash('successMessage', 'The recipe was edited successfully.');
      }

      res.redirect('/view-recipes');
    });
  }
  else {
    connection.query('DELETE FROM Recipe WHERE ?', { recipeId: req.body.recipeId }, function(err) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The recipe was unable to be deleted.');
      }
      else {
        console.log("Success delete");
        req.flash('successMessage', 'The recipe was deleted successfully.');
      }

      res.redirect('/view-recipes');
    });
  }
});

router.get('/plan-meals', function(req, res) {
  var categoryRecipeMap = {};

  getRecipes(function(recipeRows) {
    if (recipeRows.length === 0) {
      res.render('plan_meals', {
        errorMessage: req.flash('errorMessage'),
        successMessage: req.flash('successMessage'),
        title: "Plan Meals"
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
  
      res.render('plan_meals', {
        categoryRecipes: categoryRecipeMap,
        errorMessage: req.flash('errorMessage'),
        infoMessage: req.flash('infoMessage'),
        successMessage: req.flash('successMessage'),
        title: "Plan Meals"
      });
    }
  });
});

router.post('/plan-meals', function(req, res) {
  var recipeIds = [];

  for (var recipeId in req.body) {
    recipeIds.push(recipeId);
  }

  if (recipeIds.length === 0) {
    req.flash('infoMessage', 'Please select at least one recipe to plan.');

    res.redirect('/plan-meals');
  }
  else {
    connection.query('SELECT * FROM Recipe WHERE recipeId IN (?) ORDER BY name', [recipeIds.join()], function(err, rows) {
      if (err) {
        console.error(err);

        req.flash('errorMessage', 'The recipes were unable to be planned.');

        res.redirect('/plan-meals');
      }
      else {
        res.render('add_ingredients', { recipes: rows, title: "Add Ingredients" });
      }
    })
  }
});

router.get('/view-recipes', function(req, res) {
  var categoryRecipeMap = {};

  getCategories(function(categoryRows) {
    getRecipes(function(recipeRows) {
      if (recipeRows.length === 0) {
        res.render('view_recipes', { categories: categoryRows, title: "Recipes" });
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
          categoryRecipes: categoryRecipeMap,
          categories: categoryRows,
          errorMessage: req.flash('errorMessage'),
          successMessage: req.flash('successMessage'),
          title: "Recipes"
        });
      }
    });
  });
});

function getCategories(callback) {
  connection.query('SELECT * FROM Category ORDER BY name', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      callback(rows);
    }
  });
}

function getRecipes(callback) {
  connection.query('SELECT * FROM Recipe ORDER BY categoryName, name', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      callback(rows);
    }
  });
}

module.exports = router;