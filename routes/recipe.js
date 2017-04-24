var config = require('../config');
var connection = require('../connection');
var express = require('express');
var http = require('http');
var request = require('request');
var router = express.Router();
var wunderlistSDK = require('wunderlist');
var wunderlistAPI = new wunderlistSDK({
  'accessToken': config.configuration.wunderlistAccessToken,
  'clientID': config.configuration.wunderlistClientId
});

router.get('/', function(req, res) {
  res.render('index', { title: "Meal Planner" });
});

router.post('/add-ingredients', function(req, res) {
  for (var recipe in req.body) {
    wunderlistAPI.http.tasks.create({
      'list_id': config.configuration.listId,
      'title': recipe
    }).fail(function (resp) {
      console.error("An error occured while adding tasks: " + resp);
    });
  }

  res.redirect('/');
});

router.get('/plan-meals', function(req, res) {
  var categoryRecipeMap = new Object();

  getRecipes(function(recipeRows) {
    if (recipeRows.length == 0) {
      res.render('view_recipes', { title: "View Recipes" });
    }

    for (var i = 0; i < recipeRows.length; i++) {
      var categoryName = recipeRows[i].categoryName;

      if (!categoryRecipeMap[categoryName]) {
        categoryRecipeMap[categoryName] = [];
      }

      categoryRecipeMap[categoryName].push(recipeRows[i]);
    }

    res.render('plan_meals', { categoryRecipes: categoryRecipeMap, title: "Plan Meals" });
  });
});

router.post('/plan-meals', function(req, res) {
  var recipeIds = [];

  for (var recipeId in req.body) {
    recipeIds.push(recipeId);
  }

  connection.query('SELECT * FROM Recipe WHERE recipeId IN (' + recipeIds.join() + ') ORDER BY name', function(err, rows) {
    if (err) {
      throw err;
    }
    else {
      res.render('add_ingredients', { recipes: rows, title: "Add Ingredients" });
    }
  })
});

router.get('/add-recipe', function(req, res) {
  getCategories(function(categoryRows) {
    res.render('add_recipe', { title: "Add Recipe", categories: categoryRows });
  })
});

router.post('/add-recipe', function(req, res) {
  var name = req.body.name;

  var ingredients = req.body.ingredients.replace(/\r?\n|\r/g, ",");

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
      throw err;
  	}
  	else {
      res.redirect('/view-recipes');
  	}
  })
});

router.get('/edit-recipe/:recipeId', function(req, res) {
  getCategories(function(categoryRows) {
    connection.query('SELECT * FROM Recipe WHERE recipeId = ?', req.params.recipeId, function(err, rows) {
      if (err) {
        throw err;
      }
      else {
        res.render('edit_recipe', { recipeId: req.params.recipeId, name: rows[0].name, ingredients: rows[0].ingredients.replace(/,/g, "\r\n"), categoryId: rows[0].categoryId, categories: categoryRows, title: "Edit Recipe" });
      }
    });
  });
});

router.post('/edit-recipe', function(req, res) {
  if (req.body.action == "Edit Recipe") {
    var recipeName = req.body.name;

    var ingredients = req.body.ingredients.replace(/\r?\n|\r/g, ",");

    var categoryName = req.body.categoryName;

    connection.query('UPDATE Recipe SET ? WHERE ?', [ {name: recipeName, ingredients: ingredients, categoryName: categoryName}, { recipeId: req.body.recipeId}], function(err) {
      if (err) {
        throw err;
      }
    });
  }
  else {
    connection.query('DELETE FROM Recipe WHERE ?', { recipeId: req.body.recipeId }, function(err) {
      if (err) {
        throw err;
      }
    });
  }

  res.redirect('/view-recipes');
});

router.get('/view-recipes', function(req, res) {
  var categoryRecipeMap = new Object();

  getRecipes(function(recipeRows) {
    if (recipeRows.length == 0) {
      res.render('view_recipes', { title: "View Recipes" });
    }
    else {
      for (var i = 0; i < recipeRows.length; i++) {
        var categoryName = recipeRows[i].categoryName;

        if (!categoryRecipeMap[categoryName]) {
          categoryRecipeMap[categoryName] = [];
        }

        categoryRecipeMap[categoryName].push(recipeRows[i]);
      }

      res.render('view_recipes', { categoryRecipes: categoryRecipeMap, title: "View Recipes" });
    }
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